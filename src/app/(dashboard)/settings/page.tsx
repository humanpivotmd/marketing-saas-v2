'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'

// --- Types ---
interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  plan: string
  plan_display_name: string
  created_at: string
}

interface UsageData {
  plan: string
  plan_display_name: string
  period: string
  content: { used: number; limit: number }
  keyword: { used: number; limit: number }
  image: { used: number; limit: number }
  saved_keywords: { used: number; limit: number }
  channels: { used: number; limit: number }
  brand_voices: { used: number; limit: number }
}

interface BrandVoice {
  id: string
  name: string
  industry: string | null
  tone: string | null
  description: string | null
  target_audience: string | null
  keywords: string[] | null
  is_default: boolean
  created_at: string
}

interface Channel {
  id: string
  platform: string
  account_name: string
  account_id: string | null
  is_active: boolean
  created_at: string
}

// --- Helper ---
function getToken() {
  return sessionStorage.getItem('token') || ''
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
}

// --- Presets ---
const BRAND_VOICE_PRESETS = [
  { name: '카페/음식점', industry: '카페/음식점', tone: '친근한', description: '따뜻하고 감성적인 카페/음식점 마케팅 톤' },
  { name: '뷰티/패션', industry: '뷰티/패션', tone: '트렌디한', description: '세련되고 트렌디한 뷰티/패션 브랜드 톤' },
  { name: '교육/학원', industry: '교육', tone: '전문적인', description: '신뢰감 있는 교육 전문가 톤' },
  { name: '부동산', industry: '부동산', tone: '신뢰감 있는', description: '전문적이고 신뢰를 주는 부동산 중개 톤' },
  { name: 'IT/테크', industry: 'IT/테크', tone: '혁신적인', description: '혁신적이고 미래지향적인 테크 기업 톤' },
]

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  threads: 'Threads',
  youtube: 'YouTube',
  naver_blog: '네이버 블로그',
  kakao: '카카오',
}

// --- Tab IDs ---
const TABS = [
  { id: 'profile', label: '프로필' },
  { id: 'plan', label: '플랜' },
  { id: 'brand-voice', label: 'Brand Voice' },
  { id: 'sns', label: 'SNS 연동' },
  { id: 'notifications', label: '알림' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      return TABS.some((t) => t.id === hash) ? hash : 'profile'
    }
    return 'profile'
  })
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tabId}`)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">설정</h1>

      {/* Tabs */}
      <div role="tablist" aria-orientation="horizontal" className="flex border-b border-[rgba(240,246,252,0.1)] gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabChange(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'profile' && <ProfileTab onToast={setToast} />}
        {activeTab === 'plan' && <PlanTab />}
        {activeTab === 'brand-voice' && <BrandVoiceTab onToast={setToast} />}
        {activeTab === 'sns' && <SnsTab onToast={setToast} />}
        {activeTab === 'notifications' && <NotificationsTab onToast={setToast} />}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          visible
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

// =========================================
// Profile Tab
// =========================================
function ProfileTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
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
        // Update session storage
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
    return <Card><div className="animate-pulse space-y-4"><div className="h-4 bg-bg-tertiary rounded w-1/3" /><div className="h-4 bg-bg-tertiary rounded w-2/3" /></div></Card>
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

      {/* Password Modal */}
      <PasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} onToast={onToast} />

      {/* Delete Modal */}
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
        setCurrent('')
        setNewPw('')
        setConfirm('')
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

// =========================================
// Plan Tab
// =========================================
function PlanTab() {
  const [usage, setUsage] = useState<UsageData | null>(null)

  useEffect(() => {
    fetch('/api/mypage/usage', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setUsage(res.data)
      })
      .catch(() => {})
  }, [])

  if (!usage) {
    return <Card><div className="animate-pulse space-y-4"><div className="h-4 bg-bg-tertiary rounded w-1/3" /><div className="h-4 bg-bg-tertiary rounded w-full" /></div></Card>
  }

  const usageItems = [
    { label: '콘텐츠 생성', ...usage.content, color: 'bg-accent-primary' },
    { label: '키워드 분석', ...usage.keyword, color: 'bg-purple-500' },
    { label: 'AI 이미지', ...usage.image, color: 'bg-green-500' },
    { label: '저장 키워드', ...usage.saved_keywords, color: 'bg-yellow-500' },
    { label: '채널 연동', ...usage.channels, color: 'bg-pink-500' },
    { label: 'Brand Voice', ...usage.brand_voices, color: 'bg-cyan-500' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">현재 플랜</h2>
            <p className="text-sm text-text-secondary">{usage.period}</p>
          </div>
          <Badge variant="accent" size="md">{usage.plan_display_name}</Badge>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">사용량 현황</h2>
        <div className="space-y-4">
          {usageItems.map((item) => {
            const pct = item.limit > 0 ? Math.min(Math.round((item.used / item.limit) * 100), 100) : 0
            return (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <span className="text-sm text-text-primary font-medium">
                    {item.used} / {item.limit === 0 ? '무제한' : item.limit}
                  </span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-2">업그레이드</h2>
        <p className="text-sm text-text-secondary mb-4">
          더 많은 콘텐츠를 생성하고 고급 기능을 이용하세요.
        </p>
        <Button onClick={() => (window.location.href = '/pricing')}>플랜 비교하기</Button>
      </Card>
    </div>
  )
}

// =========================================
// Brand Voice Tab
// =========================================
function BrandVoiceTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [voices, setVoices] = useState<BrandVoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editVoice, setEditVoice] = useState<BrandVoice | null>(null)

  const fetchVoices = useCallback(() => {
    setLoading(true)
    fetch('/api/brand-voices', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setVoices(res.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchVoices() }, [fetchVoices])

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/brand-voices/${id}`, { method: 'DELETE', headers: authHeaders() })
    const data = await res.json()
    if (data.success) {
      onToast({ message: 'Brand Voice가 삭제되었습니다.', variant: 'success' })
      fetchVoices()
    }
  }

  const handleSetDefault = async (id: string) => {
    const res = await fetch(`/api/brand-voices/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ is_default: true }),
    })
    const data = await res.json()
    if (data.success) {
      onToast({ message: '기본 Brand Voice가 설정되었습니다.', variant: 'success' })
      fetchVoices()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Brand Voice</h2>
        <Button size="sm" onClick={() => { setEditVoice(null); setShowModal(true) }}>
          새로 만들기
        </Button>
      </div>

      {/* Presets */}
      <Card padding="sm">
        <p className="text-sm font-medium text-text-secondary mb-3">프리셋에서 시작하기</p>
        <div className="flex flex-wrap gap-2">
          {BRAND_VOICE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setEditVoice({
                  id: '',
                  name: preset.name,
                  industry: preset.industry,
                  tone: preset.tone,
                  description: preset.description,
                  target_audience: null,
                  keywords: null,
                  is_default: false,
                  created_at: '',
                })
                setShowModal(true)
              }}
              className="px-3 py-1.5 text-xs font-medium bg-bg-tertiary text-text-secondary rounded-full hover:bg-bg-tertiary/80 hover:text-text-primary transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Card key={i}><div className="h-16 animate-pulse bg-bg-tertiary rounded" /></Card>)}
        </div>
      ) : voices.length === 0 ? (
        <EmptyState
          title="Brand Voice가 없습니다"
          description="Brand Voice를 설정하면 AI가 일관된 톤으로 콘텐츠를 생성합니다."
        />
      ) : (
        <div className="space-y-3">
          {voices.map((v) => (
            <Card key={v.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{v.name}</span>
                      {v.is_default && <Badge variant="accent" size="sm">기본</Badge>}
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {[v.industry, v.tone].filter(Boolean).join(' / ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!v.is_default && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(v.id)}>기본 설정</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setEditVoice(v); setShowModal(true) }}>수정</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)}>삭제</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <BrandVoiceModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditVoice(null) }}
        voice={editVoice}
        onToast={onToast}
        onSaved={fetchVoices}
      />
    </div>
  )
}

function BrandVoiceModal({ open, onClose, voice, onToast, onSaved }: {
  open: boolean
  onClose: () => void
  voice: BrandVoice | null
  onToast: (t: { message: string; variant: 'success' | 'error' }) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: '', industry: '', tone: '', description: '', target_audience: '', is_default: false,
  })
  const [loading, setLoading] = useState(false)
  const isEdit = voice?.id ? true : false

  useEffect(() => {
    if (voice) {
      setForm({
        name: voice.name || '',
        industry: voice.industry || '',
        tone: voice.tone || '',
        description: voice.description || '',
        target_audience: voice.target_audience || '',
        is_default: voice.is_default,
      })
    } else {
      setForm({ name: '', industry: '', tone: '', description: '', target_audience: '', is_default: false })
    }
  }, [voice])

  const handleSubmit = async () => {
    if (!form.name) { onToast({ message: '이름을 입력해주세요.', variant: 'error' }); return }
    setLoading(true)
    try {
      const url = isEdit ? `/api/brand-voices/${voice!.id}` : '/api/brand-voices'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) {
        onToast({ message: isEdit ? '수정되었습니다.' : '생성되었습니다.', variant: 'success' })
        onSaved()
        onClose()
      } else {
        onToast({ message: data.error || '오류가 발생했습니다.', variant: 'error' })
      }
    } catch {
      onToast({ message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Brand Voice 수정' : 'Brand Voice 생성'} size="lg">
      <div className="space-y-4">
        <Input label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 우리 브랜드" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="업종" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="예: 카페" />
          <Input label="톤" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} placeholder="예: 친근한" />
        </div>
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">설명</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full h-24 px-4 py-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="브랜드 톤 앤 매너에 대해 설명해주세요"
          />
        </div>
        <Input label="타겟 고객" value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} placeholder="예: 20-30대 여성" />
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
            className="rounded border-[rgba(240,246,252,0.2)] bg-bg-tertiary text-accent-primary focus:ring-accent-primary"
          />
          기본 Brand Voice로 설정
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} loading={loading}>{isEdit ? '수정' : '생성'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// =========================================
// SNS Tab
// =========================================
function SnsTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
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

// =========================================
// Notifications Tab
// =========================================
function NotificationsTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [settings, setSettings] = useState({
    marketing: true,
    weekly_report: true,
    content_published: true,
    usage_warning: true,
  })

  const handleToggle = (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key as keyof typeof settings] }
    setSettings(newSettings)
    onToast({ message: '알림 설정이 변경되었습니다.', variant: 'success' })
  }

  const items = [
    { key: 'marketing', label: '마케팅 이메일', description: '프로모션, 새 기능 안내 등' },
    { key: 'weekly_report', label: '주간 리포트', description: '매주 월요일 콘텐츠 성과 리포트' },
    { key: 'content_published', label: '콘텐츠 발행 알림', description: '예약된 콘텐츠가 발행될 때' },
    { key: 'usage_warning', label: '사용량 경고', description: '사용량 한도 80% 도달 시 알림' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text-primary">이메일 알림 설정</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.key} padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{item.description}</p>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings[item.key as keyof typeof settings] ? 'bg-accent-primary' : 'bg-bg-tertiary'
                }`}
                role="switch"
                aria-checked={settings[item.key as keyof typeof settings]}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    settings[item.key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
