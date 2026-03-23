import crypto from 'crypto'

// --- Naver Search Ad API Signature ---
export function generateSignature(
  timestamp: string,
  method: string,
  uri: string
): string {
  const message = `${timestamp}.${method}.${uri}`
  return crypto
    .createHmac('sha256', process.env.NAVER_AD_SECRET_KEY!)
    .update(message)
    .digest('base64')
}

export interface NaverKeywordResult {
  keyword: string
  monthlyPc: number | string
  monthlyMobile: number | string
  monthlyTotal: number | string
  pcClickCnt: number
  mobileClickCnt: number
  pcCtr: number
  mobileCtr: number
  competition: string
  adDepth: number
}

export async function fetchNaverKeywords(
  keywords: string[]
): Promise<{ keywords: NaverKeywordResult[]; total: number }> {
  const customerId = process.env.NAVER_AD_CUSTOMER_ID
  const accessKey = process.env.NAVER_AD_ACCESS_KEY
  const secretKey = process.env.NAVER_AD_SECRET_KEY

  if (!customerId || !accessKey || !secretKey) {
    throw new Error('네이버 검색광고 API 키가 설정되지 않았습니다.')
  }

  const timestamp = String(Date.now())
  const method = 'GET'
  const uri = '/keywordstool'
  const signature = generateSignature(timestamp, method, uri)

  const cleaned = keywords.slice(0, 5).map((k) => k.replace(/\s+/g, ''))
  const hintKeywords = cleaned.map((k) => encodeURIComponent(k)).join(',')
  const queryString = 'hintKeywords=' + hintKeywords + '&showDetail=1'

  const response = await fetch(
    `https://api.searchad.naver.com${uri}?${queryString}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Timestamp': timestamp,
        'X-API-KEY': accessKey,
        'X-Customer': customerId,
        'X-Signature': signature,
      },
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`네이버 API 오류: ${response.status} - ${err}`)
  }

  const data = await response.json()
  const list: NaverKeywordResult[] = (data.keywordList || []).map(
    (k: Record<string, unknown>) => ({
      keyword: k.relKeyword as string,
      monthlyPc: k.monthlyPcQcCnt,
      monthlyMobile: k.monthlyMobileQcCnt,
      monthlyTotal:
        typeof k.monthlyPcQcCnt === 'number' &&
        typeof k.monthlyMobileQcCnt === 'number'
          ? (k.monthlyPcQcCnt as number) + (k.monthlyMobileQcCnt as number)
          : '< 10',
      pcClickCnt: k.monthlyAvePcClkCnt as number,
      mobileClickCnt: k.monthlyAveMobileClkCnt as number,
      pcCtr: k.monthlyAvePcCtr as number,
      mobileCtr: k.monthlyAveMobileCtr as number,
      competition: k.compIdx as string,
      adDepth: k.plAvgDepth as number,
    })
  )

  return { keywords: list, total: list.length }
}

// --- Naver DataLab Trend ---
export interface TrendResult {
  trend: string
  change: number
}

export async function fetchDataLabTrend(keyword: string): Promise<TrendResult> {
  try {
    const clientId = process.env.DATALAB_CLIENT_ID
    const clientSecret = process.env.DATALAB_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { trend: '—', change: 0 }
    }

    const endDate = new Date().toISOString().slice(0, 10)
    const startDate90 = new Date(Date.now() - 90 * 86400000)
      .toISOString()
      .slice(0, 10)

    const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      body: JSON.stringify({
        startDate: startDate90,
        endDate,
        timeUnit: 'week',
        keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
      }),
    })

    if (!res.ok) return { trend: '—', change: 0 }

    const data = await res.json()
    const results = data.results?.[0]?.data || []
    if (results.length < 4) return { trend: '—', change: 0 }

    const recent =
      results.slice(-4).reduce((s: number, r: { ratio: number }) => s + r.ratio, 0) / 4
    const prev =
      results.slice(-8, -4).reduce((s: number, r: { ratio: number }) => s + r.ratio, 0) / 4
    const change = prev > 0 ? Math.round(((recent - prev) / prev) * 100) : 0

    return {
      trend: change > 5 ? '상승' : change < -5 ? '하락' : '유지',
      change,
    }
  } catch {
    return { trend: '—', change: 0 }
  }
}

// --- Naver Blog Search (publish count) ---
export async function getPublishCount(keyword: string): Promise<number> {
  try {
    const clientId = process.env.DATALAB_CLIENT_ID
    const clientSecret = process.env.DATALAB_CLIENT_SECRET

    if (!clientId || !clientSecret) return 0

    const res = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1&sort=date`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    )
    if (!res.ok) return 0
    const data = await res.json()
    return data.total || 0
  } catch {
    return 0
  }
}

// --- Naver Blog Exposure Days Estimation ---
export async function getExposureDays(keyword: string): Promise<number> {
  try {
    const clientId = process.env.DATALAB_CLIENT_ID
    const clientSecret = process.env.DATALAB_CLIENT_SECRET

    if (!clientId || !clientSecret) return 14

    const res = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=10&sort=sim`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    )
    if (!res.ok) return 14

    const data = await res.json()
    const items = data.items || []
    if (!items.length) return 14

    const now = new Date()
    const days = items.map((item: { postdate?: string }) => {
      if (!item.postdate) return 14
      const y = item.postdate.substring(0, 4)
      const m = item.postdate.substring(4, 6)
      const d = item.postdate.substring(6, 8)
      const postDate = new Date(`${y}-${m}-${d}`)
      return Math.max(1, Math.round((now.getTime() - postDate.getTime()) / 86400000))
    })

    return Math.round(days.reduce((a: number, b: number) => a + b, 0) / days.length)
  } catch {
    return 14
  }
}
