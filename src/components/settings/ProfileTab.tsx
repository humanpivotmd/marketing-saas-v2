'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { authHeaders } from '@/lib/auth-client'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  plan: string
  plan_display_name: string
  created_at: string
}

export default function ProfileTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetch('/api/mypage/profile', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setProfile(res.data)
          setName(res.data.name)
        }
      })
      .catch(() => {})
  }, [])

  const handleSaveName = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/mypage/profile', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (data.success) {
        onToast({ message: '이름이 변경되었습니다.', variant: 'success' })
        const userData = sessionStorage.getItem('user')
        if (userData) {
          const parsed = JSON.parse(userData)
          parsed.name = name
          sessionStorage.setItem('user', JSON.stringify(parsed))
        }
      } else {
        onToast({ message: data.error || '오류가 발생했습니다.', variant: 'error' })
      }
    } catch {
      onToast({ message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    }
    setSaving(false)
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card><div className="space-y-4"><div className="h-5 bg-bg-tertiary rounded w-1/4 animate-pulse" /><div className="h-10 bg-bg-tertiary rounded animate-pulse" /><div className="h-10 bg-bg-tertiary rounded animate-pulse" /><div className="h-10 bg-bg-tertiary rounded w-1/3 animate-pulse" /></div></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">기본 정보</h2>
        <div className="space-y-4">
          <Input label="이메일" value={profile.email} disabled />
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button onClick={handleSaveName} loading={saving} disabled={name === profile.name} size="md">
              저장
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">보안</h2>
        <div className="space-y-3">
          <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
            비밀번호 변경
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">계정</h2>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          계정 삭제
        </Button>
        <p className="text-xs text-text-tertiary mt-2">
          계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
        </p>
      </Card>

      <PasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} onToast={onToast} />
      <DeleteAccountModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} onToast={onToast} />
    </div>
  )
}

function PasswordModal({ open, onClose, onToast }: {
  open: boolean
  onClose: () => void
  onToast: (t: { message: string; variant: 'success' | 'error' }) => void
}) {
  const [current, setCurrent] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (newPw !== confirm) {
      onToast({ message: '새 비밀번호가 일치하지 않습니다.', variant: 'error' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/mypage/password', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ current_password: current, new_password: newPw }),
      })
      const data = await res.json()
      if (data.success) {
        onToast({ message: '비밀번호가 변경되었습니다.', variant: 'success' })
        onClose()
        setCurrent(''); setNewPw(''); setConfirm('')
      } else {
        onToast({ message: data.error || '오류가 발생했습니다.', variant: 'error' })
      }
    } catch {
      onToast({ message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="비밀번호 변경">
      <div className="space-y-4">
        <Input label="현재 비밀번호" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Input label="새 비밀번호" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} hint="영문자, 숫자, 특수문자 포함 8자 이상" />
        <Input label="새 비밀번호 확인" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!current || !newPw || !confirm}>변경</Button>
        </div>
      </div>
    </Modal>
  )
}

function DeleteAccountModal({ open, onClose, onToast }: {
  open: boolean
  onClose: () => void
  onToast: (t: { message: string; variant: 'success' | 'error' }) => void
}) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mypage/account', {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        sessionStorage.clear()
        window.location.href = '/login'
      } else {
        onToast({ message: data.error || '오류가 발생했습니다.', variant: 'error' })
      }
    } catch {
      onToast({ message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="계정 삭제">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <Input
          label='확인을 위해 "삭제합니다"를 입력하세요'
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button variant="danger" onClick={handleDelete} loading={loading} disabled={confirmText !== '삭제합니다'}>
            영구 삭제
          </Button>
        </div>
      </div>
    </Modal>
  )
}
