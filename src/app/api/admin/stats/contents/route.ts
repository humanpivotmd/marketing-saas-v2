import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 콘텐츠 생성 통계 (채널별, 업종별)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    const since = new Date()
    since.setDate(since.getDate() - days)

    // 채널별 콘텐츠 생성 건수
    const { data: contents } = await supabase
      .from('contents')
      .select('channel, created_at')
      .gte('created_at', since.toISOString())

    const byChannel: Record<string, number> = {}
    for (const c of contents || []) {
      const ch = c.channel || 'unknown'
      byChannel[ch] = (byChannel[ch] || 0) + 1
    }

    // 업종별 사용자 수 (콘텐츠 생성한 유저 기준)
    const { data: activeUsers } = await supabase
      .from('users')
      .select('id, industry_id')
      .not('industry_id', 'is', null)

    const { data: industries } = await supabase
      .from('industries')
      .select('id, name')

    const industryMap = new Map((industries || []).map(i => [i.id, i.name]))

    // 업종별 콘텐츠 생성 유저 수
    const userIndustry: Record<string, string> = {}
    for (const u of activeUsers || []) {
      if (u.industry_id) userIndustry[u.id] = u.industry_id
    }

    const { data: recentContents } = await supabase
      .from('contents')
      .select('user_id')
      .gte('created_at', since.toISOString())

    const byIndustry: Record<string, number> = {}
    const seenUsers = new Set<string>()
    for (const c of recentContents || []) {
      const uid = c.user_id
      if (seenUsers.has(uid)) continue
      seenUsers.add(uid)
      const indId = userIndustry[uid]
      if (indId) {
        const name = industryMap.get(indId) || indId
        byIndustry[name] = (byIndustry[name] || 0) + 1
      }
    }

    return Response.json({
      success: true,
      data: {
        period_days: days,
        total_contents: (contents || []).length,
        by_channel: Object.entries(byChannel)
          .map(([channel, count]) => ({ channel, count }))
          .sort((a, b) => b.count - a.count),
        by_industry: Object.entries(byIndustry)
          .map(([industry, user_count]) => ({ industry, user_count }))
          .sort((a, b) => b.user_count - a.user_count)
          .slice(0, 15),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
