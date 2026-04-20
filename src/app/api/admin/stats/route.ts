import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: KPI 대시보드 (MRR/Churn/LTV + 플랜별 분포 + 최근 가입)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Active users (logged in this month)
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login_at', monthStart)

    // New users this month
    const { count: newUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart)

    // MRR: sum of this month's payments
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('paid_at', monthStart)

    const mrr = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)

    // Last month revenue for churn calc
    const { data: lastMonthPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('paid_at', lastMonthStart)
      .lt('paid_at', monthStart)

    const lastMrr = (lastMonthPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
    const churnRate = lastMrr > 0 ? Math.round(((lastMrr - mrr) / lastMrr) * 100) : 0

    // Plan distribution
    const { data: planDist } = await supabase
      .from('users')
      .select('plan_id')
      .eq('status', 'active')

    const planCounts: Record<string, number> = {}
    for (const u of planDist || []) {
      const key = u.plan_id || 'free'
      planCounts[key] = (planCounts[key] || 0) + 1
    }

    // Get plan names
    const { data: plans } = await supabase.from('plans').select('id, name, display_name')
    const planMap = new Map((plans || []).map((p) => [p.id, p]))

    const planDistribution = Object.entries(planCounts).map(([planId, count]) => {
      const plan = planMap.get(planId)
      return {
        plan_id: planId,
        name: plan?.name || 'free',
        display_name: plan?.display_name || 'Free',
        count,
      }
    })

    // Recent signups (last 10)
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, email, name, role, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // LTV estimate (total revenue / total paying users)
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount, user_id')
      .eq('status', 'completed')

    const totalRevenue = (allPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
    const uniquePayers = new Set((allPayments || []).map((p) => p.user_id)).size
    const ltv = uniquePayers > 0 ? Math.round(totalRevenue / uniquePayers) : 0

    // ── ADM1: 활성화 깔때기 (projects.current_step 집계) ──
    const { data: funnelData } = await supabase
      .from('projects')
      .select('current_step')
      .is('deleted_at', null)

    const funnelCounts: Record<number, number> = {}
    for (const p of funnelData || []) {
      const step = p.current_step || 1
      funnelCounts[step] = (funnelCounts[step] || 0) + 1
    }
    const totalProjects = (funnelData || []).length
    const funnel = [
      { step: 1, label: '프로젝트 생성', count: totalProjects, rate: 100 },
      { step: 2, label: '비즈니스 설정', count: Object.entries(funnelCounts).filter(([s]) => Number(s) >= 2).reduce((sum, [, c]) => sum + c, 0), rate: 0 },
      { step: 3, label: '제목 생성', count: Object.entries(funnelCounts).filter(([s]) => Number(s) >= 3).reduce((sum, [, c]) => sum + c, 0), rate: 0 },
      { step: 4, label: '초안 생성', count: Object.entries(funnelCounts).filter(([s]) => Number(s) >= 4).reduce((sum, [, c]) => sum + c, 0), rate: 0 },
      { step: 5, label: '채널 변환', count: Object.entries(funnelCounts).filter(([s]) => Number(s) >= 5).reduce((sum, [, c]) => sum + c, 0), rate: 0 },
      { step: 6, label: '이미지 생성', count: Object.entries(funnelCounts).filter(([s]) => Number(s) >= 6).reduce((sum, [, c]) => sum + c, 0), rate: 0 },
      { step: 7, label: '영상 스크립트', count: Object.entries(funnelCounts).filter(([s]) => Number(s) >= 7).reduce((sum, [, c]) => sum + c, 0), rate: 0 },
    ]
    for (const f of funnel) {
      f.rate = totalProjects > 0 ? Math.round((f.count / totalProjects) * 100) : 0
    }

    // ── ADM2: 구독 건강 지표 ──
    const now30 = new Date(now.getTime() + 30 * 86400000).toISOString()
    const now60 = new Date(now.getTime() + 60 * 86400000).toISOString()

    const { count: activeSubs } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('plan_id', 'is', null)
      .gt('plan_expires_at', now.toISOString())

    const { count: expiring30 } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('plan_id', 'is', null)
      .gt('plan_expires_at', now.toISOString())
      .lte('plan_expires_at', now30)

    const { count: expiring60 } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('plan_id', 'is', null)
      .gt('plan_expires_at', now30)
      .lte('plan_expires_at', now60)

    return Response.json({
      success: true,
      data: {
        kpi: {
          total_users: totalUsers || 0,
          active_users: activeUsers || 0,
          new_users: newUsers || 0,
          mrr,
          churn_rate: Math.max(churnRate, 0),
          ltv,
        },
        subscription_health: {
          active_subscriptions: activeSubs || 0,
          expiring_30_days: expiring30 || 0,
          expiring_60_days: expiring60 || 0,
        },
        activation_funnel: funnel,
        plan_distribution: planDistribution,
        recent_users: recentUsers || [],
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
