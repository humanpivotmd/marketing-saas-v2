import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'

const trendsSchema = z.object({
  keywords: z.array(z.string().min(1).max(200)).min(1).max(5),
  period: z.number().int().min(1).max(24).optional(),
})

// POST: DataLab 트렌드 조회
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req)
    const body = await req.json()
    const { keywords, period } = validateRequest(trendsSchema, body)

    const clientId = process.env.DATALAB_CLIENT_ID
    const clientSecret = process.env.DATALAB_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return Response.json({
        success: true,
        data: { results: [], period: `${period || 12}개월` },
      })
    }

    const months = period || 12
    const endDate = new Date().toISOString().slice(0, 10)
    const startDate = new Date(Date.now() - months * 30 * 86400000)
      .toISOString()
      .slice(0, 10)

    const keywordGroups = keywords.map((kw) => ({
      groupName: kw,
      keywords: [kw],
    }))

    const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      body: JSON.stringify({
        startDate,
        endDate,
        timeUnit: 'month',
        keywordGroups,
      }),
    })

    if (!res.ok) {
      return Response.json({
        success: true,
        data: { results: [], period: `${months}개월` },
      })
    }

    const data = await res.json()

    const results = (data.results || []).map(
      (r: { title: string; data: { period: string; ratio: number }[] }) => ({
        keyword: r.title,
        data: (r.data || []).map(
          (d: { period: string; ratio: number }) => ({
            date: d.period,
            ratio: d.ratio,
          })
        ),
      })
    )

    return Response.json({
      success: true,
      data: {
        results,
        period: `${startDate} ~ ${endDate}`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
