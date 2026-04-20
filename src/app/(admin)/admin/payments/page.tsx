'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authHeaders } from '@/lib/auth-client'

interface PaymentRecord {
  id: string
  user_id: string
  amount: number
  billing_cycle: string | null
  status: string
  paid_at: string
  users: { email: string; name: string }
  plans: { display_name: string } | null
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'accent' }> = {
  completed: { label: '완료', variant: 'success' },
  refunded: { label: '환불', variant: 'accent' },
  failed: { label: '실패', variant: 'default' },
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [refunding, setRefunding] = useState<string | null>(null)
  const { loading, toast, clearToast, showToast, run } = useAsyncAction(true)

  const fetchPayments = () => {
    run(async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      const r = await fetch(`/api/admin/payments?${params}`, { headers: authHeaders() })
      const res = await r.json()
      if (res.success) {
        setPayments(res.data)
        setTotalPages(res.pagination.totalPages)
      }
    })
  }

  useEffect(() => { fetchPayments() }, [page, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">결제 관리</h1>
        <div className="flex gap-2">
          {['', 'completed', 'refunded', 'failed'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                statusFilter === s
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-secondary text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {s ? STATUS_MAP[s]?.label || s : '전체'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-bg-tertiary rounded animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <p className="text-center text-text-tertiary py-8">결제 이력이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-primary text-text-tertiary text-left">
                  <th className="py-3 pr-4">사용자</th>
                  <th className="py-3 pr-4">플랜</th>
                  <th className="py-3 pr-4">금액</th>
                  <th className="py-3 pr-4">주기</th>
                  <th className="py-3 pr-4">상태</th>
                  <th className="py-3 pr-4">결제일</th>
                  <th className="py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const st = STATUS_MAP[p.status] || { label: p.status, variant: 'default' as const }
                  return (
                    <tr key={p.id} className="border-b border-border-primary/50 hover:bg-surface-secondary/50">
                      <td className="py-3 pr-4">
                        <div className="text-text-primary">{p.users?.name || '-'}</div>
                        <div className="text-xs text-text-tertiary">{p.users?.email}</div>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">{p.plans?.display_name || '-'}</td>
                      <td className="py-3 pr-4 text-text-primary font-medium">
                        {p.amount.toLocaleString()}원
                      </td>
                      <td className="py-3 pr-4 text-text-tertiary">
                        {p.billing_cycle === 'monthly' ? '월간' : p.billing_cycle === 'yearly' ? '연간' : '-'}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-text-tertiary">
                        {new Date(p.paid_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-3">
                        {p.status === 'completed' && (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={refunding === p.id}
                            onClick={async () => {
                              setRefunding(p.id)
                              try {
                                const res = await fetch(`/api/admin/payments/${p.id}/refund`, {
                                  method: 'POST',
                                  headers: authHeaders(),
                                })
                                const data = await res.json()
                                if (data.success) {
                                  showToast('환불 처리되었습니다.', 'success')
                                  fetchPayments()
                                } else {
                                  showToast(data.error || '환불 실패', 'error')
                                }
                              } catch {
                                showToast('환불 처리 중 오류', 'error')
                              }
                              setRefunding(null)
                            }}
                          >
                            환불
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs rounded bg-surface-secondary text-text-tertiary disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-3 py-1.5 text-xs text-text-secondary">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs rounded bg-surface-secondary text-text-tertiary disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </Card>

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}
