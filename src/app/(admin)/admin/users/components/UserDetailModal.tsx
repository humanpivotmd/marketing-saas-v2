'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authHeaders } from '@/lib/auth-client'

export interface User {
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

export interface UserDetail extends User {
  plan: { name: string; display_name: string } | null
  usage: { content: number; keyword: number }
}

interface UserDetailModalProps {
  open: boolean
  onClose: () => void
  user: UserDetail
  currentUserId?: string
  currentUserRole?: string
  onRefresh: () => void
}

export default function UserDetailModal({
  open,
  onClose,
  user,
  currentUserId,
  currentUserRole,
  onRefresh,
}: UserDetailModalProps) {
  const [role, setRole] = useState(user.role)
  const [status, setStatus] = useState(user.status)
  const [saving, setSaving] = useState(false)
  const [grantType, setGrantType] = useState('content_create')
  const [grantAmount, setGrantAmount] = useState('1')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPw, setResettingPw] = useState(false)
  const { toast: modalToast, clearToast: clearModalToast, run: modalRun } = useAsyncAction()

  const isSuperAdmin = currentUserRole === 'super_admin'
  const isSelf = currentUserId === user.id

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

  const handlePasswordReset = async () => {
    if (newPassword.length < 8) {
      await modalRun(async () => {
        throw new Error('비밀번호는 최소 8자 이상이어야 합니다.')
      })
      return
    }
    if (newPassword !== confirmPassword) {
      await modalRun(async () => {
        throw new Error('비밀번호 확인이 일치하지 않습니다.')
      })
      return
    }
    if (!confirm(`정말로 ${user.email}의 비밀번호를 변경하시겠습니까? 이 사용자는 즉시 로그아웃되지 않지만, 다음 로그인부터 새 비밀번호를 사용해야 합니다.`)) {
      return
    }
    setResettingPw(true)
    await modalRun(async () => {
      const res = await fetch(`/api/admin/users/${user.id}/password-reset`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ new_password: newPassword }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '비밀번호 변경 실패')
      setNewPassword('')
      setConfirmPassword('')
    }, { successMessage: '비밀번호가 변경되었습니다.' })
    setResettingPw(false)
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

        {/* Password Reset — super_admin only */}
        {isSuperAdmin && (
          <div className="border-t border-[rgba(240,246,252,0.1)] pt-4">
            <p className="text-sm font-medium text-text-primary mb-1">비밀번호 변경 <span className="text-xs text-text-tertiary ml-1">(최고관리자 전용)</span></p>
            {isSelf ? (
              <p className="text-xs text-yellow-400 mt-2">자기 자신의 비밀번호는 이 화면에서 변경할 수 없습니다. 프로필 설정을 사용하세요.</p>
            ) : (
              <div className="space-y-2 mt-2">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (8자 이상)"
                  autoComplete="new-password"
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 확인"
                  autoComplete="new-password"
                />
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePasswordReset}
                    loading={resettingPw}
                    disabled={!newPassword || !confirmPassword}
                  >
                    비밀번호 강제 변경
                  </Button>
                </div>
                <p className="text-xs text-text-tertiary">⚠️ 이 작업은 감사 로그에 기록됩니다. 변경 후 해당 사용자에게 별도로 알려주세요.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>닫기</Button>
          <Button onClick={handleSave} loading={saving}>저장</Button>
        </div>
      </div>
    </Modal>
  )
}
