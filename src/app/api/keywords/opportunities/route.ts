import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 키워드 기회 추천
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const industry = url.searchParams.get('industry') || 'general'
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)

    const { data, error } = await supabase
      .from('keyword_opportunities')
      .select('*')
      .eq('industry', industry)
      .order('opportunity_score', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Filter for rising/stable trends with high opportunity scores
    const opportunities = (data || []).map((item) => ({
      keyword: item.keyword,
      opportunity_score: item.opportunity_score,
      search_volume: item.search_volume,
      competition_level: item.competition_level,
      trend_direction: item.trend_direction,
      calculated_at: item.calculated_at,
    }))

    return Response.json({ success: true, data: opportunities })
  } catch (error) {
    return handleApiError(error)
  }
}
