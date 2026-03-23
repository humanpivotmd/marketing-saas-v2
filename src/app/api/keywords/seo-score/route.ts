import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { calculateSeoScore } from '@/lib/naver-seo-scorer'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const seoScoreSchema = z.object({
  title: z.string().max(500),
  body: z.string().min(1).max(50000),
  keyword: z.string().min(1).max(200),
  hashtags: z.array(z.string().max(100)).max(30).optional(),
})

// POST: 네이버 SEO 점수 계산
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(seoScoreSchema, body)

    const result = calculateSeoScore(data)

    return Response.json({ success: true, data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
