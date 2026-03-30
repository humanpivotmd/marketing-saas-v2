'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { BUSINESS_TYPES, CHANNEL_OPTIONS, TONE_OPTIONS, GENDER_OPTIONS, NAVER_BLOG_TOPICS } from '@/lib/constants'
import { authHeaders } from '@/lib/auth-client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'

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

export default function BusinessProfileTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const { profile: bizProfile, refresh: refreshBizProfile } = useBusinessProfile()
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

  // Context에서 프로필 반영
  useEffect(() => {
    if (bizProfile) {
      setProfile(p => ({ ...p, ...bizProfile }))
      setLoading(false)
    }
  }, [bizProfile])

  useEffect(() => {
    // 업종 캐싱 (자주 안 바뀌는 데이터)
    const cachedIndustries = sessionStorage.getItem('industries_cache')
    if (cachedIndustries) {
      try { setIndustries(JSON.parse(cachedIndustries)) } catch { /* ignore */ }
    }

    fetch('/api/industries', { headers: authHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setIndustries(res.data)
          sessionStorage.setItem('industries_cache', JSON.stringify(res.data))
        }
      })
      .catch(() => {})
      .finally(() => { if (!bizProfile) setLoading(false) })
  }, [bizProfile])

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
      refreshBizProfile()
    } catch (err) {
      onToast({ message: (err as Error).message || '저장 실패', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <Card><div className="space-y-4"><div className="h-5 bg-bg-tertiary rounded w-1/4 animate-pulse" /><div className="h-10 bg-bg-tertiary rounded animate-pulse" /><div className="h-10 bg-bg-tertiary rounded animate-pulse" /></div></Card>
      <Card><div className="space-y-4"><div className="h-5 bg-bg-tertiary rounded w-1/3 animate-pulse" /><div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-bg-tertiary rounded animate-pulse" />)}</div></div></Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ── 업종 설정 영역 ── */}
      <div className="flex items-center gap-3 pt-2">
        <h2 className="text-base font-bold text-text-primary whitespace-nowrap">업종 설정</h2>
        <div className="flex-1 h-px bg-border-primary" />
      </div>

      {/* B2B/B2C 선택 */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">비즈니스 유형</h3>
          <div className="flex gap-3">
            {BUSINESS_TYPES.map(bt => (
              <button
                key={bt.value}
                onClick={() => setProfile(p => ({ ...p, business_type: bt.value }))}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                  profile.business_type === bt.value
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary bg-surface-secondary text-text-tertiary hover:border-border-secondary'
                }`}
              >
                <div className="text-lg font-bold">{bt.value}</div>
                <div className="text-xs mt-1 opacity-75">{bt.desc}</div>
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
            className="w-full py-2.5 px-3 rounded-lg border border-border-primary text-sm"
            style={{ backgroundColor: '#0d1117', color: '#e6edf3' }}
          >
            <option value="" style={{ backgroundColor: '#0d1117', color: '#e6edf3' }}>업종을 선택하세요</option>
            {industries.map(ind => {
              const hasChildren = ind.children && ind.children.length > 0
              if (hasChildren) {
                return (
                  <optgroup key={ind.id} label={ind.name} style={{ backgroundColor: '#161b22', color: '#8b949e' }}>
                    {ind.children!.map(sub => (
                      <option key={sub.id} value={sub.id} style={{ backgroundColor: '#0d1117', color: '#e6edf3' }}>{sub.name}</option>
                    ))}
                  </optgroup>
                )
              }
              return <option key={ind.id} value={ind.id} style={{ backgroundColor: '#0d1117', color: '#e6edf3' }}>{ind.name}</option>
            })}
          </select>
        </div>
      </Card>

      {/* ── 블로그 주제 설정 영역 ── */}
      {profile.selected_channels.includes('blog') && (
        <>
          <div className="flex items-center gap-3 pt-2">
            <h2 className="text-base font-bold text-text-primary whitespace-nowrap">블로그 주제 설정</h2>
            <div className="flex-1 h-px bg-border-primary" />
          </div>
          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">블로그 카테고리</h3>
              <select
                value={profile.blog_category}
                onChange={e => setProfile(p => ({ ...p, blog_category: e.target.value }))}
                className="w-full py-2.5 px-3 rounded-lg border border-border-primary text-sm"
                style={{ backgroundColor: '#0d1117', color: '#e6edf3' }}
              >
                <option value="" style={{ backgroundColor: '#0d1117', color: '#e6edf3' }}>카테고리 선택</option>
                {NAVER_BLOG_TOPICS.map(group => (
                  <optgroup key={group.group} label={group.group} style={{ backgroundColor: '#161b22', color: '#8b949e' }}>
                    {group.topics.map(topic => (
                      <option key={topic} value={topic} style={{ backgroundColor: '#0d1117', color: '#e6edf3' }}>{topic}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </Card>
        </>
      )}

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
              {GENDER_OPTIONS.map(g => (
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

      {/* 저장 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  )
}
