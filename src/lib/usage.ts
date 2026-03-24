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
    // DB에서 유저의 plan을 직접 조회 (JWT에서 제거됨)
    let limitValue = 9999
    const { data: userData } = await supabase
      .from('users')
      .select('plan_id')
      .eq('id', userId)
      .single()

    if (userData?.plan_id) {
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
      .eq('action_type', actionType)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)

    const used = count ?? 0

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
  } catch {
    return { allowed: true, used: 0, limit: 9999, remaining: 9999 }
  }
}

export async function logUsage(
  userId: string,
  actionType: string,
  contentType?: string,
  aiModel?: string,
  tokensUsed?: number,
  estimatedCost?: number
): Promise<void> {
  const supabase = createServerSupabase()

  await supabase.from('usage_logs').insert({
    user_id: userId,
    action_type: actionType,
    content_type: contentType,
    ai_model: aiModel,
    tokens_used: tokensUsed,
    estimated_cost: estimatedCost,
  })
}

export const ACTION_TYPE_MAP: Record<string, string> = {
  blog: 'content_create',
  threads: 'content_create',
  instagram: 'content_create',
  script: 'content_create',
  keyword: 'keyword_analyze',
  image: 'image_generate',
}
