import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { buildImageScriptPrompt, type PipelineContext } from '@/lib/prompts/pipeline'
import { logUsage } from '@/lib/usage'
import { generateRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const rateLimited = checkRateLimitOrRespond(req, generateRateLimit, '/api/generate/image-script')
    if (rateLimited) return rateLimited
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()
    const body = await req.json()

    const { project_id, channel, ai_tool, image_size, image_style, style_detail } = body

    if (!project_id || !channel) {
      return Response.json({ success: false, error: 'project_id와 channel이 필요합니다.' }, { status: 400 })
    }

    // 프로젝트 조회
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

    // 중복 생성 방지: 같은 채널의 기존 스크립트 삭제 후 재생성
    await supabase.from('image_scripts').delete().eq('project_id', project_id).eq('channel', channel).eq('user_id', authUser.userId)

    // 해당 채널 콘텐츠 조회 (본문 참조용)
    const contentId = project.content_ids?.[channel]
    let channelBody = ''
    if (contentId) {
      const { data: content } = await supabase.from('contents').select('body').eq('id', contentId).eq('user_id', authUser.userId).single()
      if (content) channelBody = content.body
    }

    const snapshot = project.settings_snapshot || {}
    const ctx: PipelineContext & { aiTool: string; imageSize: string; imageStyle: 'photo' | 'illustration'; styleDetail: string; channel: string } = {
      businessType: project.business_type || 'B2C',
      keyword: project.keyword_text || '',
      companyName: snapshot.company_name,
      serviceName: snapshot.service_name,
      selectedTitle: project.selected_title || '',
      blogContent: channelBody || project.draft_content || '',
      draftContent: project.draft_content || '',
      aiTool: ai_tool || 'Midjourney',
      imageSize: image_size || '1080x1080',
      imageStyle: image_style || 'photo',
      styleDetail: style_detail || '미니멀',
      channel,
    }

    const prompt = buildImageScriptPrompt(ctx)
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
    let images = []
    let thumbnail = null
    try {
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
      images = parsed.images || []
      thumbnail = parsed.thumbnail || null
    } catch {
      images = [{ seq: 1, description_ko: text.slice(0, 200), prompt_en: text.slice(0, 200), placement: '본문' }]
    }

    // DB 저장
    const { data: saved, error: saveError } = await supabase
      .from('image_scripts')
      .insert({
        project_id,
        user_id: authUser.userId,
        content_id: contentId || null,
        channel,
        ai_tool: ai_tool || 'Midjourney',
        image_size: image_size || '1080x1080',
        image_style: image_style || 'photo',
        style_detail: style_detail || '미니멀',
        prompts: images,
        thumbnail_prompt: thumbnail ? JSON.stringify(thumbnail) : null,
        status: 'generated',
      })
      .select('id')
      .single()

    if (saveError) throw saveError

    // step_status s6 업데이트
    await supabase
      .from('projects')
      .update({ step_status: { ...project.step_status, s6: 'completed' } })
      .eq('id', project_id)
      .eq('user_id', authUser.userId)
      .is('deleted_at', null)

    await logUsage(authUser.userId, 'image_script_generate', channel, 'claude-sonnet-4-20250514', tokens)

    return Response.json({
      success: true,
      data: { id: saved?.id, channel, images, thumbnail, tokens },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
