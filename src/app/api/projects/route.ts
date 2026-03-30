import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 프로젝트 목록 (키워드별 그룹)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const status = url.searchParams.get('status') || ''
    const keyword_id = url.searchParams.get('keyword_id') || ''
    const include = url.searchParams.get('include') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', authUser.userId)

    if (status) query = query.eq('status', status)
    if (keyword_id) query = query.eq('keyword_id', keyword_id)

    const from = (page - 1) * limit
    const { data, count, error } = await query
      .order('updated_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error) throw error

    // include=contents: 각 프로젝트에 채널별 콘텐츠도 포함
    if (include === 'contents' && data && data.length > 0) {
      const projectIds = data.map((p: { id: string }) => p.id)
      const { data: contents } = await supabase
        .from('contents')
        .select('id, type, title, status, confirmed_at, seo_score, created_at, project_id, scheduled_date')
        .in('project_id', projectIds)
        .order('created_at', { ascending: true })

      const contentsByProject: Record<string, typeof contents> = {}
      for (const c of contents || []) {
        const pid = c.project_id as string
        if (!contentsByProject[pid]) contentsByProject[pid] = []
        contentsByProject[pid].push(c)
      }

      const enriched = data.map((p: { id: string }) => ({
        ...p,
        contents: contentsByProject[p.id] || [],
      }))
      return Response.json({ success: true, data: enriched, total: count })
    }

    return Response.json({ success: true, data, total: count })
  } catch (err) {
    return handleApiError(err)
  }
}

// POST: 프로젝트 생성
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()
    const body = await req.json()

    // 유저 프로필에서 설정 스냅샷 가져오기
    const { data: user } = await supabase
      .from('users')
      .select('business_type, selected_channels, target_audience, target_gender, fixed_keywords, blog_category, industry_id, company_name, service_name, writing_tone')
      .eq('id', authUser.userId)
      .single()

    // industry_id → 이름 변환
    let industryName = ''
    if (user?.industry_id) {
      const { data: ind } = await supabase.from('industries').select('name').eq('id', user.industry_id).single()
      if (ind) industryName = ind.name
    }

    const snapshot = { ...(user || {}), industry: industryName }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: authUser.userId,
        keyword_id: body.keyword_id || null,
        keyword_text: body.keyword_text || '',
        business_type: user?.business_type || body.business_type || 'B2C',
        current_step: 3,
        step_status: { s1: 'completed', s2: 'completed', s3: 'pending', s4: 'pending', s5: 'pending', s6: 'pending', s7: 'pending' },
        settings_snapshot: snapshot,
      })
      .select()
      .single()

    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    return handleApiError(err)
  }
}
