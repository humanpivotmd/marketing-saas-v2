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

// --- 네이버 블로그 주제 33개 ---
const NAVER_BLOG_TOPICS = [
  { group: '엔터테인먼트·예술', topics: ['문학·책', '영화', '미술·디자인', '공연·전시', '음악', '드라마', '스타·연예인', '만화·애니', '방송'] },
  { group: '생활·노하우·쇼핑', topics: ['일상·생각', '육아·결혼', '애완·반려동물', '쇼핑', '요리·레시피', '상품리뷰', '원예·재배'] },
  { group: '취미·여가·여행', topics: ['게임', '스포츠', '사진', '가드닝', '세계여행', '맛집'] },
  { group: '지식·동향', topics: ['IT·컴퓨터', '사회·정치', '건강·의학', '비즈니스·경제', '어학·외국어', '교육·학문', '법률', '과학·기술', '인테리어', '자동차', '패션·뷰티'] },
]

// --- 채널별 프롬프트 STEP ---
const PROMPT_STEPS = [
  { step: 'blog', label: '블로그', description: '네이버 블로그 콘텐츠 생성 시 적용' },
  { step: 'instagram', label: '인스타그램', description: '인스타그램 캡션 생성 시 적용' },
  { step: 'threads', label: 'Threads', description: 'Threads 게시글 생성 시 적용' },
  { step: 'facebook', label: '페이스북', description: '페이스북 게시물 생성 시 적용' },
  { step: 'image', label: '이미지', description: 'AI 이미지 프롬프트 생성 시 적용' },
  { step: 'video_script', label: '영상 스크립트', description: '영상 스크립트 생성 시 적용' },
]

// --- 운영 채널 옵션 ---
const CHANNEL_OPTIONS = [
  { id: 'blog', label: '블로그', icon: '📝' },
  { id: 'threads', label: 'Threads', icon: '🧵' },
  { id: 'instagram', label: '인스타그램', icon: '📸' },
  { id: 'facebook', label: '페이스북', icon: '👤' },
  { id: 'video', label: '영상', icon: '🎬' },
]

// --- 글 톤 옵션 ---
const TONE_OPTIONS = [
  { value: 'auto', label: '자동' },
  { value: 'professional', label: '전문적' },
  { value: 'friendly', label: '친근한' },
  { value: 'formal', label: '격식체' },
  { value: 'conversational', label: '대화체' },
]

const PROMPT_MODES = [
  { value: 'priority', label: '내 프롬프트 우선', description: '내 프롬프트를 최우선으로 적용' },
  { value: 'combine', label: '조합', description: '시스템 프롬프트와 내 프롬프트를 조합' },
  { value: 'reference', label: '참고', description: '내 프롬프트를 참고 수준으로 반영' },
]

// --- Tab IDs ---
const TABS = [
  { id: 'business', label: '마이페이지' },
  { id: 'profile', label: '프로필' },
  { id: 'plan', label: '플랜' },
  { id: 'keyword-settings', label: '키워드 설정' },
  { id: 'prompts', label: '채널 프롬프트' },
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
        {activeTab === 'business' && <BusinessProfileTab onToast={setToast} />}
        {activeTab === 'profile' && <ProfileTab onToast={setToast} />}
        {activeTab === 'plan' && <PlanTab />}
        {activeTab === 'keyword-settings' && <KeywordSettingsTab onToast={setToast} />}
        {activeTab === 'prompts' && <PromptsTab onToast={setToast} />}
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
// Keyword Settings Tab (고정 키워드 + 블로그 주제)
// =========================================
function KeywordSettingsTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [keywords, setKeywords] = useState<{ id: string; keyword: string; group_name: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyword, setNewKeyword] = useState('')
  const [newTopic, setNewTopic] = useState('')

  const fetchKeywords = useCallback(() => {
    setLoading(true)
    fetch('/api/keywords', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setKeywords(res.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchKeywords() }, [fetchKeywords])

  const handleAdd = async () => {
    if (!newKeyword.trim()) return
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ keyword: newKeyword.trim(), group_name: newTopic || null }),
      })
      const data = await res.json()
      if (data.success) {
        onToast({ message: '키워드가 등록되었습니다.', variant: 'success' })
        setNewKeyword('')
        setNewTopic('')
        fetchKeywords()
      } else {
        onToast({ message: data.error || '등록 실패', variant: 'error' })
      }
    } catch {
      onToast({ message: '등록 중 오류가 발생했습니다.', variant: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/keywords', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [id] }),
      })
      onToast({ message: '삭제되었습니다.', variant: 'success' })
      fetchKeywords()
    } catch {
      onToast({ message: '삭제 실패', variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">고정 키워드 관리</h2>
        <p className="text-sm text-text-secondary mt-1">콘텐츠 생성 시 자주 사용하는 키워드를 등록하세요.</p>
      </div>

      {/* 키워드 추가 */}
      <Card>
        <div className="space-y-3">
          <Input
            label="키워드"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="예: 소상공인 마케팅"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">네이버 블로그 주제</label>
            <select
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-tertiary border border-[rgba(240,246,252,0.1)] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="">주제 선택 (선택사항)</option>
              {NAVER_BLOG_TOPICS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.topics.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <Button onClick={handleAdd} disabled={!newKeyword.trim()}>키워드 등록</Button>
        </div>
      </Card>

      {/* 등록된 키워드 목록 */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          등록된 키워드 <span className="text-text-tertiary font-normal">({keywords.length})</span>
        </h3>
        {loading ? (
          <p className="text-sm text-text-tertiary">불러오는 중...</p>
        ) : keywords.length === 0 ? (
          <EmptyState title="등록된 키워드가 없습니다" description="위에서 키워드를 등록하세요." />
        ) : (
          <div className="space-y-2">
            {keywords.map((kw) => (
              <Card key={kw.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-text-primary">{kw.keyword}</span>
                    {kw.group_name && (
                      <Badge className="ml-2">{kw.group_name}</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(kw.id)}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =========================================
// Prompts Tab (채널별 개인 프롬프트)
// =========================================
interface UserPrompt {
  id: string
  step: string
  prompt_text: string
  mode: string
}

function PromptsTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [prompts, setPrompts] = useState<UserPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [editStep, setEditStep] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editMode, setEditMode] = useState('combine')

  const fetchPrompts = useCallback(() => {
    setLoading(true)
    fetch('/api/user-prompts', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPrompts(res.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchPrompts() }, [fetchPrompts])

  const handleSave = async (step: string) => {
    try {
      const res = await fetch('/api/user-prompts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ step, prompt_text: editText, mode: editMode }),
      })
      const data = await res.json()
      if (data.success) {
        onToast({ message: '프롬프트가 저장되었습니다.', variant: 'success' })
        setEditStep(null)
        fetchPrompts()
      } else {
        onToast({ message: data.error || '저장 실패', variant: 'error' })
      }
    } catch {
      onToast({ message: '저장 중 오류가 발생했습니다.', variant: 'error' })
    }
  }

  const handleDelete = async (step: string) => {
    try {
      await fetch(`/api/user-prompts?step=${step}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      onToast({ message: '프롬프트가 삭제되었습니다.', variant: 'success' })
      fetchPrompts()
    } catch {
      onToast({ message: '삭제 실패', variant: 'error' })
    }
  }

  const startEdit = (step: string) => {
    const existing = prompts.find((p) => p.step === step)
    setEditStep(step)
    setEditText(existing?.prompt_text || '')
    setEditMode(existing?.mode || 'combine')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">채널별 프롬프트 설정</h2>
        <p className="text-sm text-text-secondary mt-1">각 채널의 콘텐츠 생성 시 적용할 개인 프롬프트를 설정하세요.</p>
      </div>

      {loading ? (
        <p className="text-sm text-text-tertiary">불러오는 중...</p>
      ) : (
        <div className="space-y-3">
          {PROMPT_STEPS.map(({ step, label, description }) => {
            const existing = prompts.find((p) => p.step === step)
            const isEditing = editStep === step

            return (
              <Card key={step}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">{description}</p>

                    {existing && !isEditing && (
                      <div className="mt-3 p-3 bg-bg-tertiary/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge>{PROMPT_MODES.find((m) => m.value === existing.mode)?.label || existing.mode}</Badge>
                        </div>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{existing.prompt_text}</p>
                      </div>
                    )}

                    {isEditing && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1.5">적용 모드</label>
                          <div className="flex gap-2">
                            {PROMPT_MODES.map((m) => (
                              <button
                                key={m.value}
                                onClick={() => setEditMode(m.value)}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                  editMode === m.value
                                    ? 'bg-accent-primary text-white border-accent-primary'
                                    : 'bg-bg-tertiary text-text-secondary border-[rgba(240,246,252,0.1)] hover:border-accent-primary/50'
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="예: 광고 티가 나지 않게, 자연스럽고 친근한 말투로 작성해줘"
                          rows={4}
                          className="w-full px-3 py-2.5 rounded-lg bg-bg-tertiary border border-[rgba(240,246,252,0.1)] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(step)} disabled={!editText.trim()}>저장</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditStep(null)}>취소</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex gap-1 ml-3">
                      <button
                        onClick={() => startEdit(step)}
                        className="px-3 py-1.5 text-xs rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                      >
                        {existing ? '수정' : '설정'}
                      </button>
                      {existing && (
                        <button
                          onClick={() => handleDelete(step)}
                          className="px-3 py-1.5 text-xs rounded-lg text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
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

// =========================================
// Business Profile Tab (마이페이지)
// =========================================
interface BusinessProfile {
  business_type: string
  selected_channels: string[]
  target_audience: string
  target_gender: string
  fixed_keywords: string[]
  blog_category: string
  industry_id: string
  company_name: string
  service_name: string
  writing_tone: string
}

interface IndustryNode {
  id: string
  name: string
  children?: IndustryNode[]
}

function BusinessProfileTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [profile, setProfile] = useState<BusinessProfile>({
    business_type: 'B2C',
    selected_channels: [],
    target_audience: '',
    target_gender: 'all',
    fixed_keywords: [],
    blog_category: '',
    industry_id: '',
    company_name: '',
    service_name: '',
    writing_tone: 'auto',
  })
  const [industries, setIndustries] = useState<IndustryNode[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 프로필 로드
    fetch('/api/mypage/business-profile', { headers: authHeaders() })
      .then(r => r.json())
      .then(res => { if (res.success && res.data) setProfile(p => ({ ...p, ...res.data })) })
      .catch(() => {})
      .finally(() => setLoading(false))

    // 업종 로드
    fetch('/api/industries', { headers: authHeaders() })
      .then(r => r.json())
      .then(res => { if (res.success) setIndustries(res.data) })
      .catch(() => {})
  }, [])

  const toggleChannel = (ch: string) => {
    setProfile(p => ({
      ...p,
      selected_channels: p.selected_channels.includes(ch)
        ? p.selected_channels.filter(c => c !== ch)
        : [...p.selected_channels, ch]
    }))
  }

  const addKeyword = () => {
    const kw = keywordInput.trim()
    if (!kw || profile.fixed_keywords.length >= 5 || profile.fixed_keywords.includes(kw)) return
    setProfile(p => ({ ...p, fixed_keywords: [...p.fixed_keywords, kw] }))
    setKeywordInput('')
  }

  const removeKeyword = (kw: string) => {
    setProfile(p => ({ ...p, fixed_keywords: p.fixed_keywords.filter(k => k !== kw) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/mypage/business-profile', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onToast({ message: '마이페이지 설정이 저장되었습니다.', variant: 'success' })
    } catch (err) {
      onToast({ message: (err as Error).message || '저장 실패', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-12 text-center text-text-tertiary">로딩 중...</div>

  return (
    <div className="space-y-6">
      {/* B2B/B2C 선택 */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">비즈니스 유형</h3>
          <div className="flex gap-3">
            {(['B2B', 'B2C'] as const).map(type => (
              <button
                key={type}
                onClick={() => setProfile(p => ({ ...p, business_type: type }))}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                  profile.business_type === type
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary bg-surface-secondary text-text-tertiary hover:border-border-secondary'
                }`}
              >
                <div className="text-lg font-bold">{type}</div>
                <div className="text-xs mt-1 opacity-75">
                  {type === 'B2B' ? '기업 대상 (논리·데이터 중심)' : '소비자 대상 (감성·스토리 중심)'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 업종 선택 */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">업종 선택</h3>
          <select
            value={profile.industry_id}
            onChange={e => setProfile(p => ({ ...p, industry_id: e.target.value }))}
            className="w-full py-2.5 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm"
          >
            <option value="">업종을 선택하세요</option>
            {industries.map(ind => (
              <optgroup key={ind.id} label={ind.name}>
                {ind.children?.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
                {(!ind.children || ind.children.length === 0) && (
                  <option value={ind.id}>{ind.name}</option>
                )}
              </optgroup>
            ))}
          </select>
        </div>
      </Card>

      {/* 회사/서비스 정보 */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">기본 정보</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="회사명"
              value={profile.company_name}
              onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))}
              placeholder="회사명 입력"
            />
            <Input
              label="서비스/제품명"
              value={profile.service_name}
              onChange={e => setProfile(p => ({ ...p, service_name: e.target.value }))}
              placeholder="서비스 또는 제품명"
            />
          </div>
        </div>
      </Card>

      {/* 운영 채널 */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">운영 채널 (복수 선택)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CHANNEL_OPTIONS.map(ch => (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                  profile.selected_channels.includes(ch.id)
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary bg-surface-secondary text-text-tertiary hover:border-border-secondary'
                }`}
              >
                {ch.icon} {ch.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 타겟/성별 */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">타겟 설정</h3>
          <Input
            label="타겟 고객"
            value={profile.target_audience}
            onChange={e => setProfile(p => ({ ...p, target_audience: e.target.value }))}
            placeholder="예: 20~30대 직장인, 소상공인"
          />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">성별</label>
            <div className="flex gap-2">
              {([
                { value: 'all', label: '전체' },
                { value: 'male', label: '남성' },
                { value: 'female', label: '여성' },
              ] as const).map(g => (
                <button
                  key={g.value}
                  onClick={() => setProfile(p => ({ ...p, target_gender: g.value }))}
                  className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                    profile.target_gender === g.value
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-primary text-text-tertiary hover:border-border-secondary'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 고정 키워드 */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">고정 키워드 (최대 5개)</h3>
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              placeholder="키워드 입력 후 Enter"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            />
            <Button onClick={addKeyword} disabled={!keywordInput.trim() || profile.fixed_keywords.length >= 5}>추가</Button>
          </div>
          {profile.fixed_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.fixed_keywords.map(kw => (
                <span key={kw} className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-primary/10 text-accent-primary text-sm rounded-full">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 글 톤 */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">글 작성 톤</h3>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map(t => (
              <button
                key={t.value}
                onClick={() => setProfile(p => ({ ...p, writing_tone: t.value }))}
                className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                  profile.writing_tone === t.value
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary text-text-tertiary hover:border-border-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 블로그 카테고리 (블로그 선택 시만) */}
      {profile.selected_channels.includes('blog') && (
        <Card>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">블로그 카테고리</h3>
            <select
              value={profile.blog_category}
              onChange={e => setProfile(p => ({ ...p, blog_category: e.target.value }))}
              className="w-full py-2.5 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm"
            >
              <option value="">카테고리 선택</option>
              {NAVER_BLOG_TOPICS.map(group => (
                <optgroup key={group.group} label={group.group}>
                  {group.topics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* 저장 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  )
}
