import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: AI API 비용 모니터링
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '30')

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: logs, error } = await supabase
      .from('usage_logs')
      .select('action, tokens, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    // Aggregate by action type
    const byType: Record<string, { count: number; tokens: number; cost: number }> = {}
    const byDay: Record<string, { count: number; cost: number }> = {}

    for (const log of logs || []) {
      const type = log.action || 'unknown'
      if (!byType[type]) byType[type] = { count: 0, tokens: 0, cost: 0 }
      byType[type].count++
      byType[type].tokens += log.tokens || 0
      // 비용 추정: input $3/MTok, output $15/MTok → 평균 $9/MTok
      byType[type].cost += ((log.tokens || 0) / 1_000_000) * 9

      const day = (log.created_at as string).slice(0, 10)
      if (!byDay[day]) byDay[day] = { count: 0, cost: 0 }
      byDay[day].count++
      byDay[day].cost += ((log.tokens || 0) / 1_000_000) * 9
    }

    const totalCost = Object.values(byType).reduce((s, v) => s + v.cost, 0)
    const totalTokens = Object.values(byType).reduce((s, v) => s + v.tokens, 0)

    return Response.json({
      success: true,
      data: {
        period_days: days,
        total_cost: Math.round(totalCost * 100) / 100,
        total_tokens: totalTokens,
        total_requests: (logs || []).length,
        by_type: byType,
        by_day: Object.entries(byDay)
          .map(([date, v]) => ({ date, ...v }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
