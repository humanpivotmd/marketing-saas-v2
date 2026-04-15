'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authHeaders } from '@/lib/auth-client'
import UserDetailModal, { type User, type UserDetail } from './components/UserDetailModal'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>()
  const { loading, toast, clearToast, run } = useAsyncAction(true)

  // 현재 로그인한 관리자 정보 (super_admin 권한 판별용)
  useEffect(() => {
    fetch('/api/auth/me', { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.user) {
          setCurrentUserId(data.user.id)
          setCurrentUserRole(data.user.role)
        }
      })
      .catch(() => {})
  }, [])

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
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onRefresh={() => fetchUsers(pagination.page)}
        />
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}
