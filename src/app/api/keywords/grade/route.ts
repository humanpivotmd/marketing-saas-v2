import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { gradeKeywords } from '@/lib/grade'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'
import { checkUsageLimit, logUsage } from '@/lib/usage'

const gradeSchema = z.object({
  keywords: z.array(z.string().min(1).max(200)).min(1).max(10),
})

// POST: 키워드 등급 분석 A+~D-
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const { keywords } = validateRequest(gradeSchema, body)

    // Check usage limit
    const usage = await checkUsageLimit(user.userId, 'keyword_analyze')
    if (!usage.allowed) {
      return Response.json(
        { error: usage.error, code: usage.code },
        { status: 403 }
      )
    }

    const result = await gradeKeywords(keywords)

    // Log usage
    await logUsage(user.userId, 'keyword_analyze')

    return Response.json({ success: true, data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
