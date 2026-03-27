'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'

interface User {
  id: string
  email: string
  name: string
  role: string
  status: string
  plan_id: string | null
  onboarding_done: boolean
  last_login_at: string | null
  created_at: string
}

interface UserDetail extends User {
  plan: { name: string; display_name: string } | null
  usage: { content: number; keyword: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

import { authHeaders } from '@/lib/auth-client'

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const { loading, toast, clearToast, run } = useAsyncAction(true)

  const fetchUsers = useCallback((page = 1) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('status', statusFilter)

    run(async () => {
      const res = await fetch(`/api/admin/users?${params}`, { headers: authHeaders() })
      const json = await res.json()
      if (json.success) {
        setUsers(json.data)
        setPagination(json.pagination)
      }
    })
  }, [search, roleFilter, statusFilter, run])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openDetail = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { headers: authHeaders() })
    const data = await res.json()
    if (data.success) {
      setSelectedUser(data.data)
      setShowDetail(true)
    }
  }

  const handleQuickAction = async (id: string, action: string, value: unknown) => {
    await run(async () => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ [action]: value }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '오류가 발생했습니다.')
      fetchUsers(pagination.page)
    }, { successMessage: '변경되었습니다.' })
  }

  const handleUnlock = async (id: string) => {
    await run(async () => {
      const res = await fetch(`/api/admin/users/${id}/unlock`, { method: 'POST', headers: authHeaders() })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      fetchUsers(pagination.page)
    }, { successMessage: '잠금이 해제되었습니다.' })
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">회원 관리</h1>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="이름 또는 이메일 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm"
          >
            <option value="">전체 역할</option>
            <option value="user">사용자</option>
            <option value="admin">관리자</option>
            <option value="super_admin">최고관리자</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm"
          >
            <option value="">전체 상태</option>
            <option value="active">활성</option>
            <option value="pending">대기</option>
            <option value="suspended">정지</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(240,246,252,0.1)]">
                <th className="text-left py-2.5 px-3 text-text-tertiary font-medium">이름</th>
                <th className="text-left py-2.5 px-3 text-text-tertiary font-medium">이메일</th>
                <th className="text-left py-2.5 px-3 text-text-tertiary font-medium">역할</th>
                <th className="text-left py-2.5 px-3 text-text-tertiary font-medium">상태</th>
                <th className="text-left py-2.5 px-3 text-text-tertiary font-medium">가입일</th>
                <th className="text-left py-2.5 px-3 text-text-tertiary font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="py-3 px-3"><div className="h-4 bg-bg-tertiary rounded animate-pulse" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-text-tertiary">사용자가 없습니다.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-[rgba(240,246,252,0.05)] hover:bg-bg-tertiary/30 transition-colors">
                    <td className="py-2.5 px-3 text-text-primary font-medium">{u.name}</td>
                    <td className="py-2.5 px-3 text-text-secondary">{u.email}</td>
                    <td className="py-2.5 px-3"><Badge size="sm">{ROLE_LABELS[u.role] || u.role}</Badge></td>
                    <td className="py-2.5 px-3">
                      <Badge variant={u.status === 'active' ? 'success' : u.status === 'suspended' ? 'error' : 'warning'} size="sm">
                        {STATUS_LABELS[u.status] || u.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-text-tertiary">{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(u.id)}>상세</Button>
                        {u.status === 'suspended' && (
                          <Button variant="ghost" size="sm" onClick={() => handleUnlock(u.id)}>잠금해제</Button>
                        )}
                        {u.status === 'active' && (
                          <Button variant="ghost" size="sm" onClick={() => handleQuickAction(u.id, 'status', 'suspended')}>정지</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-[rgba(240,246,252,0.1)] mt-4">
            <span className="text-xs text-text-tertiary">
              총 {pagination.total}명 중 {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1}>
                이전
              </Button>
              <Button variant="ghost" size="sm" onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                다음
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          open={showDetail}
          onClose={() => { setShowDetail(false); setSelectedUser(null) }}
          user={selectedUser}
          onRefresh={() => fetchUsers(pagination.page)}
        />
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}

function UserDetailModal({ open, onClose, user, onRefresh }: {
  open: boolean
  onClose: () => void
  user: UserDetail
  onRefresh: () => void
}) {
  const [role, setRole] = useState(user.role)
  const [status, setStatus] = useState(user.status)
  const [saving, setSaving] = useState(false)
  const [grantType, setGrantType] = useState('content_create')
  const [grantAmount, setGrantAmount] = useState('1')
  const { toast: modalToast, clearToast: clearModalToast, run: modalRun } = useAsyncAction()

  const handleSave = async () => {
    setSaving(true)
    await modalRun(async () => {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ role, status }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '오류가 발생했습니다.')
      onRefresh()
      onClose()
    }, { successMessage: '변경되었습니다.' })
    setSaving(false)
  }

  const handleGrant = async () => {
    await modalRun(async () => {
      const res = await fetch(`/api/admin/users/${user.id}/usage-grant`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action_type: grantType, amount: parseInt(grantAmount) }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '오류가 발생했습니다.')
    }, { successMessage: '사용량이 부여되었습니다.' })
  }

  return (
    <Modal open={open} onClose={onClose} title="회원 상세" size="lg">
      {modalToast && <Toast message={modalToast.message} variant={modalToast.variant} visible onClose={clearModalToast} />}
      <div className="space-y-5">
        {/* Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-text-tertiary">이름:</span> <span className="text-text-primary ml-1">{user.name}</span></div>
          <div><span className="text-text-tertiary">이메일:</span> <span className="text-text-primary ml-1">{user.email}</span></div>
          <div><span className="text-text-tertiary">플랜:</span> <span className="text-text-primary ml-1">{user.plan?.display_name || 'Free'}</span></div>
          <div><span className="text-text-tertiary">가입일:</span> <span className="text-text-primary ml-1">{new Date(user.created_at).toLocaleDateString('ko-KR')}</span></div>
        </div>

        {/* Usage */}
        <div className="bg-bg-tertiary/50 rounded-lg p-3">
          <p className="text-xs text-text-tertiary mb-2">이번 달 사용량</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-text-secondary">콘텐츠: <span className="text-text-primary font-medium">{user.usage.content}건</span></div>
            <div className="text-text-secondary">키워드: <span className="text-text-primary font-medium">{user.usage.keyword}건</span></div>
          </div>
        </div>

        {/* Role/Status Change */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">역할</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm">
              <option value="user">사용자</option>
              <option value="admin">관리자</option>
              <option value="super_admin">최고관리자</option>
            </select>
            <p className="text-xs text-text-tertiary mt-1">관리자: 대시보드 조회 가능, 최고관리자: 회원 삭제 등 전체 권한</p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm">
              <option value="active">활성</option>
              <option value="pending">대기 (이메일 인증 전)</option>
              <option value="suspended">정지 (로그인 차단)</option>
            </select>
          </div>
        </div>

        {/* Usage Grant */}
        <div className="border-t border-[rgba(240,246,252,0.1)] pt-4">
          <p className="text-sm font-medium text-text-primary mb-3">사용량 수동 지급</p>
          <div className="flex gap-2 items-end">
            <select value={grantType} onChange={(e) => setGrantType(e.target.value)} className="h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm">
              <option value="content_create">콘텐츠</option>
              <option value="keyword_analyze">키워드</option>
              <option value="image_generate">이미지</option>
            </select>
            <Input value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} type="number" placeholder="수량" />
            <Button variant="secondary" size="md" onClick={handleGrant}>지급</Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>닫기</Button>
          <Button onClick={handleSave} loading={saving}>저장</Button>
        </div>
      </div>
    </Modal>
  )
}
