import { NextRequest } from 'next/server'
import { handleApiError, AppError } from '@/lib/errors'
import { getClientIp, rateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'
import { fetchNaverKeywords, getPublishCount, getExposureDays } from '@/lib/naver'
import { calculateGrade } from '@/lib/grade'

// 1일 3회 제한 (86400000ms = 24h)
const previewRateLimit = rateLimit(86400000, 3)

export async function POST(req: NextRequest) {
  try {
    const rateLimited = checkRateLimitOrRespond(req, previewRateLimit, '/api/public/keyword-preview')
    if (rateLimited) return rateLimited

    const { keyword } = await req.json()

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      throw new AppError('키워드를 입력해주세요.', 400, 'VALIDATION_ERROR')
    }

    const trimmed = keyword.trim()

    // 실제 네이버 API로 키워드 데이터 조회
    let monthlySearch = 0
    let avgCpc = 0
    let competition = '낮음'

    try {
      const adData = await fetchNaverKeywords([trimmed])
      const exact = adData.keywords.find(
        (k) => k.keyword.replace(/\s+/g, '') === trimmed.replace(/\s+/g, '')
      )
      if (exact) {
        const pc = typeof exact.monthlyPc === 'number' ? exact.monthlyPc : 0
        const mobile = typeof exact.monthlyMobile === 'number' ? exact.monthlyMobile : 0
        monthlySearch = pc + mobile
        avgCpc = typeof exact.pcClickCnt === 'number' && typeof exact.mobileClickCnt === 'number'
          ? Math.round((exact.pcClickCnt + exact.mobileClickCnt) / 2)
          : 0
        competition = exact.competition === 'HIGH' ? '높음'
          : exact.competition === 'MEDIUM' ? '중간'
          : '낮음'
      }
    } catch {
      // API 실패 시 기본값 유지
    }

    // 발행량 & 노출일 조회
    const [monthlyPublish, exposureDays] = await Promise.all([
      getPublishCount(trimmed).catch(() => 0),
      getExposureDays(trimmed).catch(() => 14),
    ])

    // 등급 계산 (경쟁도 높으면 → 포화도 높음 → 기회등급 낮음)
    const gradeResult = calculateGrade(monthlySearch, monthlyPublish, exposureDays, avgCpc)

    const previewData = {
      keyword: trimmed,
      monthly_search: monthlySearch,
      competition,
      grade: gradeResult.grade,
      opportunity: gradeResult.opportunity,
      opportunity_score: gradeResult.total_score,
      cta: '더 자세한 분석은 무료 가입 후 확인하세요.',
    }

    const ip = getClientIp(req)
    const remaining = Math.max(0, 3 - (previewRateLimit(ip, '/api/public/keyword-preview') ? 0 : 3))

    return Response.json({
      success: true,
      data: previewData,
      remaining_today: remaining,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
