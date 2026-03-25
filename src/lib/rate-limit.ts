interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

if (typeof globalThis !== 'undefined') {
  const globalAny = globalThis as Record<string, unknown>
  if (!globalAny.__rateLimitCleanup) {
    globalAny.__rateLimitCleanup = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(key)
      }
    }, 300000)
  }
}

export function rateLimit(windowMs: number, maxRequests: number) {
  function checkRateLimit(ip: string, path: string): boolean {
    const key = `${ip}:${path}`
    const now = Date.now()
    const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs }

    if (now > entry.resetAt) {
      entry.count = 0
      entry.resetAt = now + windowMs
    }

    entry.count++
    rateLimitMap.set(key, entry)

    return entry.count <= maxRequests
  }

  return checkRateLimit
}

export const loginRateLimit = rateLimit(60000, 10)
export const registerRateLimit = rateLimit(60000, 5)
export const forgotPasswordRateLimit = rateLimit(60000, 3)
export const passwordChangeRateLimit = rateLimit(60000, 5)
export const supportRateLimit = rateLimit(60000, 10)
export const channelRateLimit = rateLimit(60000, 10)
export const socialSettingsRateLimit = rateLimit(60000, 10)
export const accountDeleteRateLimit = rateLimit(300000, 3)
export const generateRateLimit = rateLimit(60000, 10)  // AI 생성 API: 분당 10회

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}

export function checkRateLimitOrRespond(
  req: Request,
  checker: ReturnType<typeof rateLimit>,
  path: string
): Response | null {
  const ip = getClientIp(req)
  const allowed = checker(ip, path)
  if (!allowed) {
    const key = `${ip}:${path}`
    const entry = rateLimitMap.get(key)
    const retryAfter = entry ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 60
    return new Response(
      JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMIT_EXCEEDED' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, retryAfter)),
          'X-RateLimit-Limit': '0',
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }
  return null
}
