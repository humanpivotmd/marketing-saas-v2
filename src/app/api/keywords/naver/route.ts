import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { fetchNaverKeywords } from '@/lib/naver'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const naverSearchSchema = z.object({
  keywords: z.array(z.string().min(1).max(200)).min(1).max(5),
})

// POST: 네이버 키워드 검색량 조회
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req)
    const body = await req.json()
    const { keywords } = validateRequest(naverSearchSchema, body)

    const result = await fetchNaverKeywords(keywords)

    return Response.json({ success: true, data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
