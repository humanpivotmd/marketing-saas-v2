import { fetchNaverKeywords, fetchDataLabTrend, getPublishCount, getExposureDays } from './naver'
import { createServerSupabase } from './supabase/server'

export interface GradeInfo {
  grade: string
  min: number
  difficulty: string
  opportunity: string
}

export interface GradeResult {
  keyword: string
  grade: string
  difficulty: string
  opportunity: string
  total_score: number
  monthly_search: number
  monthly_publish: number
  saturation: number
  avg_cpc: number
  exposure_days: number
  trend: string
  trend_change: number
  priority: string
  from_cache: boolean
}

export interface GradeRecommendations {
  beginner: GradeResult[]
  intermediate: GradeResult[]
  advanced: GradeResult[]
  avoid: GradeResult[]
}

export const GRADE_MAP: GradeInfo[] = [
  { grade: 'A+', min: 90, difficulty: '매우 쉬움', opportunity: '매우 높음' },
  { grade: 'A', min: 83, difficulty: '쉬움', opportunity: '높음' },
  { grade: 'A-', min: 78, difficulty: '쉬움', opportunity: '중상' },
  { grade: 'B+', min: 72, difficulty: '보통 이하', opportunity: '중상' },
  { grade: 'B', min: 66, difficulty: '보통', opportunity: '중' },
  { grade: 'B-', min: 60, difficulty: '보통 이상', opportunity: '중하' },
  { grade: 'C+', min: 52, difficulty: '높음', opportunity: '중하' },
  { grade: 'C', min: 44, difficulty: '높음', opportunity: '낮음' },
  { grade: 'C-', min: 36, difficulty: '매우 높음', opportunity: '낮음' },
  { grade: 'D+', min: 28, difficulty: '극히 높음', opportunity: '매우 낮음' },
  { grade: 'D', min: 20, difficulty: '극히 높음', opportunity: '매우 낮음' },
  { grade: 'D-', min: 0, difficulty: '포화', opportunity: '없음' },
]

const GRADE_WEIGHTS = {
  search: 0.35,
  saturation: 0.35,
  exposure: 0.2,
  cpc: 0.1,
}

export function scoreSearch(vol: number): number {
  if (vol >= 100000) return 20
  if (vol >= 50000) return 30
  if (vol >= 10000) return 50
  if (vol >= 5000) return 70
  if (vol >= 1000) return 85
  if (vol >= 500) return 90
  if (vol >= 100) return 80
  if (vol >= 50) return 60
  if (vol >= 10) return 40
  return 15
}

export function scoreSaturation(sat: number): number {
  if (sat <= 5) return 95
  if (sat <= 10) return 85
  if (sat <= 30) return 75
  if (sat <= 50) return 65
  if (sat <= 100) return 55
  if (sat <= 300) return 40
  if (sat <= 1000) return 25
  if (sat <= 5000) return 15
  return 5
}

export function scoreExposure(days: number): number {
  if (days >= 90) return 100
  if (days >= 60) return 85
  if (days >= 30) return 70
  if (days >= 14) return 55
  if (days >= 7) return 40
  if (days >= 3) return 25
  return 10
}

export function scoreCpc(cpc: number): number {
  if (cpc >= 5000) return 90
  if (cpc >= 3000) return 75
  if (cpc >= 1000) return 60
  if (cpc >= 500) return 45
  if (cpc >= 100) return 30
  return 15
}

export function calculateGrade(
  monthlySearch: number,
  monthlyPublish: number,
  exposureDays: number,
  avgCpc: number
): GradeInfo & { total_score: number; saturation: number } {
  const saturation =
    monthlySearch > 0
      ? Math.min((monthlyPublish / monthlySearch) * 100, 9999)
      : monthlyPublish > 0
        ? 9999
        : 50

  const score =
    scoreSearch(monthlySearch) * GRADE_WEIGHTS.search +
    scoreSaturation(saturation) * GRADE_WEIGHTS.saturation +
    scoreExposure(exposureDays) * GRADE_WEIGHTS.exposure +
    scoreCpc(avgCpc) * GRADE_WEIGHTS.cpc

  const gradeInfo = GRADE_MAP.find((g) => score >= g.min) || GRADE_MAP[GRADE_MAP.length - 1]

  return {
    ...gradeInfo,
    total_score: Math.round(score * 10) / 10,
    saturation: Math.round(saturation * 10) / 10,
  }
}

export async function gradeKeywords(
  keywords: string[]
): Promise<{ results: GradeResult[]; recommendations: GradeRecommendations }> {
  const supabase = createServerSupabase()
  const results: GradeResult[] = []

  for (const kw of keywords.slice(0, 10)) {
    // Check keyword_opportunities cache
    const { data: cached } = await supabase
      .from('keyword_opportunities')
      .select('*')
      .eq('keyword', kw)
      .single()

    const isExpired =
      !cached ||
      Date.now() - new Date(cached.calculated_at).getTime() > 7 * 86400000

    if (!isExpired && cached) {
      results.push({
        keyword: kw,
        grade: cached.competition_level || 'B',
        difficulty: '보통',
        opportunity: '중',
        total_score: cached.opportunity_score,
        monthly_search: cached.search_volume || 0,
        monthly_publish: 0,
        saturation: 0,
        avg_cpc: 0,
        exposure_days: 14,
        trend: cached.trend_direction || 'stable',
        trend_change: 0,
        priority: 'medium',
        from_cache: true,
      })
      continue
    }

    let monthlySearch = 0
    let avgCpc = 0
    try {
      const adData = await fetchNaverKeywords([kw])
      const exact = adData.keywords.find(
        (k) => k.keyword.replace(/\s+/g, '') === kw.replace(/\s+/g, '')
      )
      if (exact) {
        monthlySearch =
          (typeof exact.monthlyPc === 'number' ? exact.monthlyPc : 0) +
          (typeof exact.monthlyMobile === 'number' ? exact.monthlyMobile : 0)
        avgCpc = typeof exact.pcClickCnt === 'number' && typeof exact.mobileClickCnt === 'number'
          ? Math.round((exact.pcClickCnt + exact.mobileClickCnt) / 2)
          : 0
      }
    } catch {
      // API failure: keep 0
    }

    const [monthlyPublish, exposureDays] = await Promise.all([
      getPublishCount(kw),
      getExposureDays(kw),
    ])

    const trendData = await fetchDataLabTrend(kw)
    const grade = calculateGrade(monthlySearch, monthlyPublish, exposureDays, avgCpc)

    const result: GradeResult = {
      keyword: kw,
      grade: grade.grade,
      difficulty: grade.difficulty,
      opportunity: grade.opportunity,
      total_score: grade.total_score,
      monthly_search: monthlySearch,
      monthly_publish: monthlyPublish,
      saturation: grade.saturation,
      avg_cpc: avgCpc,
      exposure_days: exposureDays,
      trend: trendData.trend,
      trend_change: trendData.change,
      priority: 'medium',
      from_cache: false,
    }

    // Cache to keyword_opportunities
    await supabase.from('keyword_opportunities').upsert(
      {
        keyword: kw,
        industry: 'general',
        opportunity_score: grade.total_score,
        search_volume: monthlySearch,
        competition_level: grade.grade,
        trend_direction: trendData.change > 5 ? 'rising' : trendData.change < -5 ? 'declining' : 'stable',
        calculated_at: new Date().toISOString(),
      },
      { onConflict: 'keyword,industry' }
    )

    results.push(result)

    if (keywords.indexOf(kw) < keywords.length - 1) {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  const recommendations: GradeRecommendations = {
    beginner: results.filter((r) => ['A+', 'A', 'A-'].includes(r.grade)),
    intermediate: results.filter((r) => ['B+', 'B', 'B-'].includes(r.grade)),
    advanced: results.filter((r) => ['C+', 'C'].includes(r.grade)),
    avoid: results.filter((r) => ['C-', 'D+', 'D', 'D-'].includes(r.grade)),
  }

  return { results, recommendations }
}
