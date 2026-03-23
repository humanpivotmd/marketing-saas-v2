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
        plan_distribution: planDistribution,
        recent_users: recentUsers || [],
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
