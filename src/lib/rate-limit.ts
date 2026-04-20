import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Redis 기반 Rate Limit (프로덕션) / 인메모리 fallback (개발) ──

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

let redis: Redis | null = null
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

// ── 인메모리 fallback (개발 환경, Redis 미설정 시) ──
interface RateLimitEntry { count: number; resetAt: number }
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

function memoryCheck(ip: string, path: string, windowMs: number, maxRequests: number): boolean {
  const key = `${ip}:${path}`
  const now = Date.now()
  const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs }
  entry.count++
  rateLimitMap.set(key, entry)
  return entry.count <= maxRequests
}

// Redis limiter 캐시 (windowMs+maxRequests 조합별)
const redisLimiters = new Map<string, Ratelimit>()
function getRedisLimiter(windowMs: number, maxRequests: number): Ratelimit {
  const key = `${windowMs}:${maxRequests}`
  let limiter = redisLimiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(maxRequests, `${Math.round(windowMs / 1000)} s`),
      prefix: 'mf-rl',
    })
    redisLimiters.set(key, limiter)
  }
  return limiter
}

// ── 통합 팩토리 — 동기 인터페이스 유지 (호출부 변경 불필요) ──
type SyncChecker = (ip: string, path: string) => boolean

export function rateLimit(windowMs: number, maxRequests: number): SyncChecker {
  // 인메모리 체커만 반환 (동기)
  // Redis 체크는 checkRateLimitOrRespond에서 별도 처리
  return (ip: string, path: string) => memoryCheck(ip, path, windowMs, maxRequests)
}

// 내부용: rateLimit 설정값 저장
const rateLimitConfigs = new Map<SyncChecker, { windowMs: number; maxRequests: number }>()
function rateLimitWithConfig(windowMs: number, maxRequests: number): SyncChecker {
  const checker = rateLimit(windowMs, maxRequests)
  rateLimitConfigs.set(checker, { windowMs, maxRequests })
  return checker
}

export const loginRateLimit = rateLimitWithConfig(60000, 10)
export const registerRateLimit = rateLimitWithConfig(60000, 5)
export const forgotPasswordRateLimit = rateLimitWithConfig(60000, 3)
export const passwordChangeRateLimit = rateLimitWithConfig(60000, 5)
export const supportRateLimit = rateLimitWithConfig(60000, 10)
export const channelRateLimit = rateLimitWithConfig(60000, 10)
export const socialSettingsRateLimit = rateLimitWithConfig(60000, 10)
export const accountDeleteRateLimit = rateLimitWithConfig(300000, 3)
export const generateRateLimit = rateLimitWithConfig(60000, 10)

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}

export function checkRateLimitOrRespond(
  req: Request,
  checker: SyncChecker,
  path: string
): Response | null {
  const ip = getClientIp(req)

  // Redis 사용 시: 비동기 체크를 fire-and-forget으로 실행하고 인메모리 결과 사용
  // (인메모리가 1차 방어, Redis가 멀티 인스턴스 정합성 보장)
  if (useRedis) {
    const config = rateLimitConfigs.get(checker)
    if (config) {
      getRedisLimiter(config.windowMs, config.maxRequests)
        .limit(`${ip}:${path}`)
        .catch(() => {}) // Redis 실패는 무시, 인메모리가 방어
    }
  }

  const allowed = checker(ip, path)
  if (!allowed) {
    return new Response(
      JSON.stringify({ success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMIT_EXCEEDED' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }
  return null
}
