'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface KpiData {
  kpi: {
    total_users: number
    active_users: number
    new_users: number
    mrr: number
    churn_rate: number
    ltv: number
  }
  plan_distribution: { plan_id: string; name: string; display_name: string; count: number }[]
  recent_users: { id: string; email: string; name: string; role: string; status: string; created_at: string }[]
}

interface CostData {
  total_cost: number
  total_tokens: number
  total_requests: number
  by_type: Record<string, { count: number; tokens: number; cost: number }>
}

function getToken() {
  return sessionStorage.getItem('token') || ''
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n)
}

const STATUS_LABELS: Record<string, string> = {
  active: '활성',
  pending: '대기',
  suspended: '정지',
}

const ROLE_LABELS: Record<string, string> = {
  user: '사용자',
  admin: '관리자',
  super_admin: '최고관리자',
}

export default function AdminDashboard() {
  const [data, setData] = useState<KpiData | null>(null)
  const [costs, setCosts] = useState<CostData | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data) })
      .catch(() => {})

    fetch('/api/admin/stats/costs?days=30', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => { if (res.success) setCosts(res.data) })
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">KPI 대시보드</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><div className="h-20 animate-pulse bg-bg-tertiary rounded" /></Card>
          ))}
        </div>
      </div>
    )
  }

  const kpiCards = [
    { label: '월간 반복 매출 (MRR)', value: formatCurrency(data.kpi.mrr), sub: '이번 달 결제 합계', color: 'text-accent-primary' },
    { label: '이탈률', value: `${data.kpi.churn_rate}%`, sub: '전월 대비 매출 이탈', color: data.kpi.churn_rate > 5 ? 'text-accent-error' : 'text-accent-success' },
    { label: '고객 생애 가치 (LTV)', value: formatCurrency(data.kpi.ltv), sub: '유료 고객 평균 결제 총액', color: 'text-purple-400' },
    { label: '활성 사용자', value: data.kpi.active_users.toLocaleString(), sub: `전체 ${data.kpi.total_users.toLocaleString()}명`, color: 'text-cyan-400' },
  ]

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">KPI 대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-xs text-text-tertiary uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-text-secondary mt-1">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">플랜별 분포</h2>
          <div className="space-y-3">
            {data.plan_distribution.map((p) => {
              const total = data.plan_distribution.reduce((s, x) => s + x.count, 0)
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0
              return (
                <div key={p.plan_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{p.display_name}</span>
                    <span className="text-text-primary font-medium">{p.count}명 ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full bg-accent-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {data.plan_distribution.length === 0 && (
              <p className="text-sm text-text-tertiary">데이터가 없습니다.</p>
            )}
          </div>
        </Card>

        {/* AI Costs */}
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">AI API 비용 (30일)</h2>
          {costs ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">총 비용</span>
                <span className="text-lg font-bold text-accent-primary">${costs.total_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">총 요청</span>
                <span className="text-sm text-text-primary font-medium">{costs.total_requests.toLocaleString()}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">총 토큰</span>
                <span className="text-sm text-text-primary font-medium">{costs.total_tokens.toLocaleString()}</span>
              </div>
              {costs.total_cost > 50 && (
                <div className="bg-accent-error/10 border border-accent-error/20 rounded-lg p-2 mt-2">
                  <p className="text-xs text-accent-error font-medium">비용 경고: 30일 비용이 $50를 초과했습니다.</p>
                </div>
              )}
              <div className="border-t border-[rgba(240,246,252,0.1)] pt-3 mt-3 space-y-2">
                {Object.entries(costs.by_type).map(([type, v]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-text-tertiary">{type}</span>
                    <span className="text-text-secondary">{v.count}건 / ${v.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 animate-pulse bg-bg-tertiary rounded" />
          )}
        </Card>
      </div>

      {/* Recent Signups */}
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">최근 가입자</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(240,246,252,0.1)]">
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">이름</th>
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">이메일</th>
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">역할</th>
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">상태</th>
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">가입일</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_users.map((u) => (
                <tr key={u.id} className="border-b border-[rgba(240,246,252,0.05)] hover:bg-bg-tertiary/30 transition-colors">
                  <td className="py-2.5 px-3 text-text-primary">{u.name}</td>
                  <td className="py-2.5 px-3 text-text-secondary">{u.email}</td>
                  <td className="py-2.5 px-3"><Badge size="sm">{ROLE_LABELS[u.role] || u.role}</Badge></td>
                  <td className="py-2.5 px-3">
                    <Badge variant={u.status === 'active' ? 'success' : u.status === 'suspended' ? 'error' : 'warning'} size="sm">
                      {STATUS_LABELS[u.status] || u.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-text-tertiary">{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Users This Month */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <p className="text-xs text-text-tertiary">이번 달 신규 가입</p>
          <p className="text-2xl font-bold text-accent-success mt-1">{data.kpi.new_users}명</p>
        </Card>
        <Card>
          <p className="text-xs text-text-tertiary">전체 회원 수</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{data.kpi.total_users}명</p>
        </Card>
      </div>
    </div>
  )
}
