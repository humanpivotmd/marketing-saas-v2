import { createServerSupabase } from './supabase/server'

export interface UsageLimitResult {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  resetDate?: string
  error?: string
  code?: 'USAGE_LIMIT_EXCEEDED' | 'PLAN_UPGRADE_REQUIRED'
}

export async function checkUsageLimit(
  userId: string,
  actionType: string
): Promise<UsageLimitResult> {
  const supabase = createServerSupabase()

  try {
    // DB에서 유저의 role과 plan을 직접 조회
    let limitValue = 9999
    const { data: userData } = await supabase
      .from('users')
      .select('plan_id, role, plan_expires_at')
      .eq('id', userId)
      .single()

    // 관리자는 모든 기능 무제한
    if (userData?.role === 'admin') {
      return { allowed: true, used: 0, limit: 0, remaining: Infinity }
    }

    // 플랜 만료 체크: plan_expires_at이 현재보다 과거면 무료 플랜 한도 적용
    const planExpired = userData?.plan_expires_at
      && new Date(userData.plan_expires_at) < new Date()

    if (userData?.plan_id && !planExpired) {
      const { data: plan } = await supabase
        .from('plans')
        .select('content_limit, keyword_limit, image_limit')
        .eq('id', userData.plan_id)
        .single()

      if (plan) {
        const limitMap: Record<string, number> = {
          content_create: plan.content_limit,
          keyword_analyze: plan.keyword_limit,
          image_generate: plan.image_limit,
        }
        limitValue = limitMap[actionType] ?? 9999
      }
    }

    if (limitValue === 0) {
      // 0 = unlimited
      return { allowed: true, used: 0, limit: 0, remaining: Infinity }
    }

    // Count this month's usage
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

    const { count } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', actionType)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)

    // Grant 레코드 카운트 (admin 수동 지급 — 만료 없이 누적)
    const { count: grantCount } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', `${actionType}_grant`)

    const used = Math.max(0, (count ?? 0) - (grantCount ?? 0))

    if (used >= limitValue) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return {
        allowed: false,
        used,
        limit: limitValue,
        remaining: 0,
        code: 'USAGE_LIMIT_EXCEEDED',
        error: `이번 달 사용 한도(${limitValue}회)를 모두 사용했습니다.`,
        resetDate: `${nextMonth.getFullYear()}년 ${nextMonth.getMonth() + 1}월 1일`,
      }
    }

    return {
      allowed: true,
      used,
      limit: limitValue,
      remaining: limitValue - used,
    }
  } catch (err) {
    console.error('[checkUsageLimit] DB error — fail-open:', err)
    return { allowed: true, used: 0, limit: 9999, remaining: 9999 }
  }
}

export async function logUsage(
  userId: string,
  actionType: string,
  contentType?: string,
  _aiModel?: string,
  tokensUsed?: number,
  _estimatedCost?: number
): Promise<void> {
  const supabase = createServerSupabase()
  const now = new Date()
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  await supabase.from('usage_logs').insert({
    user_id: userId,
    action: actionType,
    step: contentType || actionType,
    tokens: tokensUsed || 0,
    year_month: yearMonth,
  })
}

// Re-export for backward compatibility
export { ACTION_TYPE_MAP } from '@/lib/constants'
