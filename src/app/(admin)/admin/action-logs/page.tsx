'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authHeaders } from '@/lib/auth-client'

interface ActionLog {
  id: string
  admin_id: string
  target_user_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  password_reset: '비밀번호 초기화',
  role_change: '역할 변경',
  status_change: '상태 변경',
  usage_grant: '사용량 부여',
  user_delete: '회원 삭제',
  user_unlock: '잠금 해제',
  project_delete: '프로젝트 삭제',
  prompt_activate: '프롬프트 활성화',
  plan_limit_change: '플랜 변경',
}

export default function ActionLogsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const { loading, toast, clearToast, run } = useAsyncAction(true)

  const fetchLogs = () => {
    run(async () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (actionFilter) params.set('action', actionFilter)
      const r = await fetch(`/api/admin/action-logs?${params}`, { headers: authHeaders() })
      const res = await r.json()
      if (res.success) {
        setLogs(res.data)
        setTotalPages(res.pagination.totalPages)
      }
    })
  }

  useEffect(() => { fetchLogs() }, [page, actionFilter])

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">액션 로그</h1>
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1) }}
          className="px-3 py-1.5 text-xs rounded-lg bg-surface-secondary text-text-secondary border border-border-primary"
        >
          <option value="">전체</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <Card>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-bg-tertiary rounded animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-text-tertiary py-8">액션 로그가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-secondary/50 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="default">{ACTION_LABELS[log.action] || log.action}</Badge>
                  <span className="text-text-tertiary text-xs">
                    {log.metadata && Object.keys(log.metadata).length > 0
                      ? JSON.stringify(log.metadata).slice(0, 80)
                      : ''}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary shrink-0">
                  {new Date(log.created_at).toLocaleString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 text-xs rounded bg-surface-secondary text-text-tertiary disabled:opacity-50">이전</button>
            <span className="px-3 py-1.5 text-xs text-text-secondary">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs rounded bg-surface-secondary text-text-tertiary disabled:opacity-50">다음</button>
          </div>
        )}
      </Card>

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}
