'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { PLATFORM_LABELS } from '@/lib/constants'
import { authHeaders } from '@/lib/auth-client'

interface Channel {
  id: string
  platform: string
  account_name: string
  account_id: string | null
  is_active: boolean
  created_at: string
}

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    instagram: 'M7.8 2h8.4C19 2 21 4 21 6.8v8.4a4.8 4.8 0 01-4.8 4.8H7.8A4.8 4.8 0 013 15.2V6.8A4.8 4.8 0 017.8 2zm8 2H8.2A2.8 2.8 0 005.4 6.8v8.4a2.8 2.8 0 002.8 2.8h7.6a2.8 2.8 0 002.8-2.8V6.8A2.8 2.8 0 0015.8 4zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm5.2-.9a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z',
    threads: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    youtube: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z',
  }
  const d = icons[platform] || 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d={d} />
    </svg>
  )
}

function AddChannelModal({ open, onClose, onToast, onSaved }: {
  open: boolean
  onClose: () => void
  onToast: (t: { message: string; variant: 'success' | 'error' }) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({ platform: 'instagram', account_name: '', account_id: '', access_token: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.account_name) { onToast({ message: '계정명을 입력해주세요.', variant: 'error' }); return }
    setLoading(true)
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        onToast({ message: '채널이 연동되었습니다.', variant: 'success' })
        onSaved()
        onClose()
        setForm({ platform: 'instagram', account_name: '', account_id: '', access_token: '' })
      } else {
        onToast({ message: data.error || '오류가 발생했습니다.', variant: 'error' })
      }
    } catch {
      onToast({ message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="채널 연동">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">플랫폼</label>
          <select
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
            className="w-full h-11 px-4 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="instagram">Instagram</option>
            <option value="threads">Threads</option>
            <option value="youtube">YouTube</option>
            <option value="naver_blog">네이버 블로그</option>
          </select>
        </div>
        <Input label="계정명" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="@username" />
        <Input label="계정 ID (선택)" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} hint="플랫폼에서 발급받은 고유 ID" />
        <Input label="인증 키 (선택)" value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} type="password" hint="자동 발행을 위한 인증 키입니다. 플랫폼 개발자 설정에서 발급받을 수 있습니다." />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} loading={loading}>연동</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function SnsTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  const fetchChannels = useCallback(() => {
    setLoading(true)
    fetch('/api/channels', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setChannels(res.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchChannels() }, [fetchChannels])

  const handleTest = async (channelId: string) => {
    setTesting(channelId)
    try {
      const res = await fetch('/api/channels/test', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ channel_id: channelId }),
      })
      const data = await res.json()
      onToast({
        message: data.message || (data.connected ? '연결 성공' : '연결 실패'),
        variant: data.connected ? 'success' : 'error',
      })
    } catch {
      onToast({ message: '연결 테스트 중 오류가 발생했습니다.', variant: 'error' })
    }
    setTesting(null)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/channels/${id}`, { method: 'DELETE', headers: authHeaders() })
    const data = await res.json()
    if (data.success) {
      onToast({ message: '채널 연동이 해제되었습니다.', variant: 'success' })
      fetchChannels()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">SNS 채널 연동</h2>
        <Button size="sm" onClick={() => setShowAddModal(true)}>채널 추가</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Card key={i}><div className="h-16 animate-pulse bg-bg-tertiary rounded" /></Card>)}
        </div>
      ) : channels.length === 0 ? (
        <EmptyState
          title="연동된 채널이 없습니다"
          description="SNS 채널을 연동하면 콘텐츠를 직접 발행할 수 있습니다."
          action={<Button size="sm" onClick={() => setShowAddModal(true)}>채널 추가</Button>}
        />
      ) : (
        <div className="space-y-3">
          {channels.map((ch) => (
            <Card key={ch.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-secondary">
                    <PlatformIcon platform={ch.platform} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{ch.account_name}</span>
                      <Badge variant={ch.is_active ? 'success' : 'default'} size="sm">
                        {ch.is_active ? '활성' : '비활성'}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-tertiary">{PLATFORM_LABELS[ch.platform] || ch.platform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTest(ch.id)}
                    loading={testing === ch.id}
                  >
                    테스트
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(ch.id)}>해제</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddChannelModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onToast={onToast}
        onSaved={fetchChannels}
      />
    </div>
  )
}
