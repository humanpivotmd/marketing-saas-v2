import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { buildDraftPrompt, type PipelineContext } from '@/lib/prompts/pipeline'
import { logUsage } from '@/lib/usage'
import { generateRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const rateLimited = checkRateLimitOrRespond(req, generateRateLimit, '/api/generate/draft')
    if (rateLimited) return rateLimited
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()
    const body = await req.json()

    const { project_id } = body
    if (!project_id) {
      return Response.json({ success: false, error: 'project_id가 필요합니다.' }, { status: 400 })
    }

    // 프로젝트 조회
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', authUser.userId)
      .single()

    if (!project) {
      return Response.json({ success: false, error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미 초안이 있으면 스킵 (중복 생성 방지)
    if (project.draft_content && project.step_status?.s4 === 'completed') {
      return Response.json({ success: true, data: { tokens: 0, skipped: true } })
    }

    const snapshot = project.settings_snapshot || {}
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
      userPrompt: project.custom_prompt,
      promptMode: project.prompt_mode,
      coreMessage: project.core_message || snapshot.core_message,
    }

    const prompt = buildDraftPrompt(ctx)
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
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      return Response.json({ success: false, error: `AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.` }, { status: 502 })
    }

    const result = await claudeRes.json()
    const draftContent = result.content?.[0]?.text || ''
    const tokens = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)

    // 프로젝트에 초안 저장 + 단계 진행
    await supabase
      .from('projects')
      .update({
        draft_content: draftContent,
        current_step: 5,
        step_status: { ...project.step_status, s4: 'completed' },
      })
      .eq('id', project_id)
      .eq('user_id', authUser.userId)

    await logUsage(authUser.userId, 'draft_generate', 'draft', 'claude-sonnet-4-20250514', tokens)

    return Response.json({ success: true, data: { tokens } })
  } catch (err) {
    return handleApiError(err)
  }
}
