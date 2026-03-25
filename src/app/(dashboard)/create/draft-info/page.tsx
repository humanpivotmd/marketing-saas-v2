'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toast from '@/components/ui/Toast'
import SetupRequired from '@/components/SetupRequired'

const TOPIC_TYPES = [
  { value: 'info', label: '정보형', desc: '독자에게 유용한 정보 제공' },
  { value: 'intro', label: '회사 소개', desc: '회사/브랜드를 알리는 글' },
  { value: 'service', label: '서비스 소개', desc: '서비스 설명 및 장점' },
  { value: 'product', label: '상품 소개', desc: '제품 리뷰 및 소개' },
]

const TONE_OPTIONS = [
  { value: 'auto', label: '자동' },
  { value: 'professional', label: '전문적' },
  { value: 'friendly', label: '친근한' },
  { value: 'formal', label: '격식체' },
  { value: 'conversational', label: '대화체' },
]

const PROMPT_MODES = [
  { value: 'combine', label: '조합', desc: '시스템 + 내 프롬프트 동등 결합' },
  { value: 'priority', label: '내 프롬프트 우선', desc: '내 프롬프트를 최우선 적용' },
  { value: 'reference', label: '참고만', desc: '내 프롬프트를 참고 수준으로 반영' },
]

function getToken() { return sessionStorage.getItem('token') || '' }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }

export default function DraftInfoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const keywordId = searchParams.get('keyword_id') || ''
  const keywordText = searchParams.get('keyword') || ''

  const [businessType, setBusinessType] = useState<'B2B' | 'B2C'>('B2C')
  const [companyName, setCompanyName] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [topicType, setTopicType] = useState('info')
  const [tone, setTone] = useState('auto')
  const [customPrompt, setCustomPrompt] = useState('')
  const [promptMode, setPromptMode] = useState('combine')
  const [titles, setTitles] = useState<string[]>([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  // 마이페이지 설정 로드
  useEffect(() => {
    fetch('/api/mypage/business-profile', { headers: authHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setBusinessType(res.data.business_type || 'B2C')
          setCompanyName(res.data.company_name || '')
          setServiceName(res.data.service_name || '')
          setTone(res.data.writing_tone || 'auto')
        }
      })
      .catch(() => {})
  }, [])

  const handleGenerateTitles = async () => {
    setGenerating(true)
    setTitles([])
    setSelectedTitle('')
    try {
      const res = await fetch('/api/generate/titles', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          keyword: keywordText,
          business_type: businessType,
          company_name: companyName,
          service_name: serviceName,
          topic_type: topicType,
          tone,
          custom_prompt: customPrompt,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setTitles(data.data.titles || [])
    } catch (err) {
      setToast({ message: (err as Error).message || '제목 생성 실패', variant: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  const handleStartDraft = async () => {
    if (!selectedTitle) return
    setCreating(true)
    try {
      // 프로젝트 생성
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          keyword_id: keywordId || undefined,
          keyword_text: keywordText,
          business_type: businessType,
        }),
      })
      const projData = await projRes.json()
      if (!projData.success) throw new Error(projData.error)

      const projectId = projData.data.id

      // 프로젝트에 STEP3 데이터 저장
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          topic_type: topicType,
          selected_title: selectedTitle,
          title_candidates: titles,
          custom_prompt: customPrompt || null,
          prompt_mode: promptMode,
          current_step: 4,
          step_status: { s1: 'completed', s2: 'completed', s3: 'completed', s4: 'pending', s5: 'pending', s6: 'pending', s7: 'pending' },
        }),
      })

      // STEP4 초안 생성 페이지로 이동
      router.push(`/create/generating?project_id=${projectId}`)
    } catch (err) {
      setToast({ message: (err as Error).message || '프로젝트 생성 실패', variant: 'error' })
      setCreating(false)
    }
  }

  if (!keywordText) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-text-tertiary">키워드를 먼저 선택해주세요.</p>
        <Button onClick={() => router.push('/keywords')}>키워드 분석으로 이동</Button>
      </div>
    )
  }

  return (
    <SetupRequired>
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">초안 정보 입력</h1>
        <p className="text-sm text-text-tertiary mt-1">키워드: <strong>{keywordText}</strong></p>
      </div>

      {/* B2B / B2C */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">비즈니스 유형</h3>
          <div className="flex gap-3">
            {(['B2B', 'B2C'] as const).map(type => (
              <button
                key={type}
                onClick={() => setBusinessType(type)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                  businessType === type
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary bg-surface-secondary text-text-tertiary hover:border-border-secondary'
                }`}
              >
                <div className="text-lg font-bold">{type}</div>
                <div className="text-xs mt-1 opacity-75">
                  {type === 'B2B' ? '논리·데이터 중심' : '감성·스토리 중심'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 기본 정보 */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="회사명" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="회사명" />
          <Input label="서비스/제품명" value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="서비스 또는 제품명" />
        </div>
      </Card>

      {/* 글 주제 유형 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">글 주제 유형</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TOPIC_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTopicType(t.value)}
              className={`py-3 px-3 rounded-lg text-sm border transition-all text-left ${
                topicType === t.value
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-border-primary text-text-tertiary hover:border-border-secondary'
              }`}
            >
              <div className="font-medium">{t.label}</div>
              <div className="text-xs mt-0.5 opacity-75">{t.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* 톤 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">톤앤매너</h3>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map(t => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                tone === t.value
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-border-primary text-text-tertiary hover:border-border-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 커스텀 프롬프트 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">커스텀 프롬프트 (선택)</h3>
        <textarea
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          placeholder='예: "CTA를 강조해주세요", "사례를 포함해주세요"'
          rows={3}
          className="w-full py-2.5 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm resize-none"
        />
        {customPrompt.trim() && (
          <div className="mt-3">
            <p className="text-xs text-text-tertiary mb-2">프롬프트 적용 모드</p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setPromptMode(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    promptMode === m.value
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-primary text-text-tertiary hover:border-border-secondary'
                  }`}
                >
                  <div className="font-medium">{m.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-75">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 제목 생성 */}
      <div className="flex justify-center">
        <Button onClick={handleGenerateTitles} disabled={generating || !keywordText}>
          {generating ? '제목 생성 중...' : '제목 생성하기'}
        </Button>
      </div>

      {/* 제목 선택 */}
      {titles.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-3">제목 선택 (5개)</h3>
          <div className="space-y-2">
            {titles.map((title, i) => (
              <button
                key={i}
                onClick={() => setSelectedTitle(title)}
                className={`w-full text-left py-3 px-4 rounded-lg border text-sm transition-all ${
                  selectedTitle === title
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary font-medium'
                    : 'border-border-primary text-text-secondary hover:border-border-secondary'
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* 초안 작성 시작 */}
      {selectedTitle && (
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="text-sm text-text-tertiary hover:text-text-secondary">
            이전
          </button>
          <Button onClick={handleStartDraft} disabled={creating}>
            {creating ? '프로젝트 생성 중...' : '초안 작성 시작'}
          </Button>
        </div>
      )}

      <Toast message={toast?.message || ''} variant={toast?.variant} visible={!!toast} onClose={() => setToast(null)} />
    </div>
    </SetupRequired>
  )
}
