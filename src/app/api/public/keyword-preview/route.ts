import { NextRequest } from 'next/server'
import { handleApiError, AppError } from '@/lib/errors'
import { getClientIp, rateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

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

    // Return sample preview data
    // In production, this would call the Naver API with limited data
    const sampleData = {
      keyword: trimmed,
      monthly_search: Math.floor(Math.random() * 20000) + 1000,
      competition: ['낮음', '중간', '높음'][Math.floor(Math.random() * 3)],
      grade: ['S', 'A+', 'A', 'B+', 'B', 'C'][Math.floor(Math.random() * 6)],
      opportunity_score: Math.floor(Math.random() * 40) + 60,
      cta: '더 자세한 분석은 무료 가입 후 확인하세요.',
    }

    const ip = getClientIp(req)
    const remaining = Math.max(0, 3 - (previewRateLimit(ip, '/api/public/keyword-preview') ? 0 : 3))

    return Response.json({
      success: true,
      data: sampleData,
      remaining_today: remaining,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
