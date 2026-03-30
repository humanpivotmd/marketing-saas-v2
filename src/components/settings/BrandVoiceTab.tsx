'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { BRAND_VOICE_PRESETS } from '@/lib/constants'
import { authHeaders } from '@/lib/auth-client'

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

export default function BrandVoiceTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
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
