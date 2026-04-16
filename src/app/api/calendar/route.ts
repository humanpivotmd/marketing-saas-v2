import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 날짜 범위 내 발행 예정 콘텐츠 조회
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const from = url.searchParams.get('from') // YYYY-MM-DD
    const to = url.searchParams.get('to')     // YYYY-MM-DD

    // 활성 프로젝트 ID 목록 조회 (소프트 삭제된 프로젝트 제외)
    const { data: activeProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.userId)
      .is('deleted_at', null)

    const activeIds = (activeProjects || []).map((p: { id: string }) => p.id)

    let query = supabase
      .from('contents')
      .select('id, channel, title, status, scheduled_date, confirmed_at, project_id')
      .eq('user_id', user.userId)
      .not('scheduled_date', 'is', null)
      .or(`project_id.in.(${activeIds.join(',')}),project_id.is.null`)
      .order('scheduled_date', { ascending: true })

    if (from) query = query.gte('scheduled_date', from)
    if (to) query = query.lte('scheduled_date', to)

    const { data, error } = await query
    if (error) throw error

    // 날짜별 그룹핑
    const byDate: Record<string, typeof data> = {}
    for (const item of data || []) {
      const date = item.scheduled_date as string
      if (!byDate[date]) byDate[date] = []
      byDate[date].push(item)
    }

    return Response.json({ success: true, data: byDate })
  } catch (err) {
    return handleApiError(err)
  }
}
