'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toast from '@/components/ui/Toast'
import SetupRequired from '@/components/SetupRequired'
import { TOPIC_TYPES, TONE_OPTIONS, PROMPT_MODES, BUSINESS_TYPES } from '@/lib/constants'
import { authHeaders } from '@/lib/auth-client'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'

export default function DraftInfoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const keywordId = searchParams.get('keyword_id') || ''
  const keywordText = searchParams.get('keyword') || ''

  const { profile: bizProfile } = useBusinessProfile()
  const [businessType, setBusinessType] = useState<'B2B' | 'B2C'>('B2C')
  const [companyName, setCompanyName] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [topicType, setTopicType] = useState('info')
  const [tone, setTone] = useState('auto')
  const [customPrompt, setCustomPrompt] = useState('')
  const [coreMessage, setCoreMessage] = useState('')
  const [promptMode, setPromptMode] = useState('combine')
  const [titles, setTitles] = useState<string[]>([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const { toast, clearToast, run } = useAsyncAction()

  // Context에서 비즈니스 프로필 반영
  useEffect(() => {
    if (bizProfile) {
      setBusinessType((bizProfile.business_type as 'B2B' | 'B2C') || 'B2C')
      setCompanyName(bizProfile.company_name || '')
      setServiceName(bizProfile.service_name || '')
      setTone(bizProfile.writing_tone || 'auto')
    }
  }, [bizProfile])

  const handleGenerateTitles = async () => {
    setGenerating(true)
    setTitles([])
    setSelectedTitle('')
    await run(async () => {
      const res = await fetch('/api/generate/titles', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          keyword: keywordText,
          business_type: businessType,
          company_name: companyName,
          service_name: serviceName,
          topic_type: topicType,
          core_message: coreMessage || undefined,
          tone,
          custom_prompt: customPrompt,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setTitles(data.data.titles || [])
    })
    setGenerating(false)
  }

  const finalTitle = customTitle.trim() || selectedTitle
  const handleStartDraft = async () => {
    if (!finalTitle) return
    setCreating(true)
    await run(async () => {
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
      const patchRes = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          topic_type: topicType,
          selected_title: finalTitle,
          title_candidates: titles,
          custom_prompt: customPrompt || null,
          prompt_mode: promptMode,
          core_message: coreMessage || null,
          current_step: 4,
          step_status: { s1: 'completed', s2: 'completed', s3: 'completed', s4: 'pending', s5: 'pending', s6: 'pending', s7: 'pending' },
        }),
      })
      const patchData = await patchRes.json()
      if (!patchData.success) throw new Error(patchData.error || 'STEP3 저장 실패')

      // STEP4 초안 생성 페이지로 이동
      router.push(`/create/generating?project_id=${projectId}`)
    }, {
      errorMessage: '프로젝트 생성 실패',
      onError: () => setCreating(false),
    })
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
            {BUSINESS_TYPES.map(bt => (
              <button
                key={bt.value}
                onClick={() => setBusinessType(bt.value)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                  businessType === bt.value
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary bg-surface-secondary text-text-tertiary hover:border-border-secondary'
                }`}
              >
                <div className="text-lg font-bold">{bt.label}</div>
                <div className="text-xs mt-1 opacity-75">{bt.desc}</div>
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

      {/* 핵심 전달 내용 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">핵심 전달 내용 (선택)</h3>
        <textarea
          value={coreMessage}
          onChange={e => setCoreMessage(e.target.value)}
          placeholder='예: "3월 할인 이벤트 진행 중", "신규 기능 출시"'
          rows={2}
          className="w-full py-2.5 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm resize-none"
        />
        <p className="text-xs text-text-tertiary mt-1">입력하면 AI가 이 내용을 중심으로 글을 작성합니다.</p>
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
                onClick={() => { setSelectedTitle(title); setCustomTitle('') }}
                className={`w-full text-left py-3 px-4 rounded-lg border text-sm transition-all ${
                  selectedTitle === title && !customTitle.trim()
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary font-medium'
                    : 'border-border-primary text-text-secondary hover:border-border-secondary'
                }`}
              >
                {title}
              </button>
            ))}
          </div>

          {/* 직접 입력 */}
          <div className="mt-4 pt-4 border-t border-border-primary">
            <h4 className="text-sm font-medium text-text-secondary mb-2">또는 직접 입력</h4>
            <Input
              placeholder="제목을 직접 입력하세요"
              value={customTitle}
              onChange={(e) => {
                setCustomTitle(e.target.value)
                if (e.target.value.trim()) setSelectedTitle('')
              }}
            />
            {customTitle.trim() && (
              <p className="text-xs text-accent-primary mt-1">직접 입력한 제목으로 진행합니다.</p>
            )}
          </div>
        </Card>
      )}

      {/* 초안 작성 시작 */}
      {finalTitle && (
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="text-sm text-text-tertiary hover:text-text-secondary">
            이전
          </button>
          <Button onClick={handleStartDraft} disabled={creating}>
            {creating ? '프로젝트 생성 중...' : '초안 작성 시작'}
          </Button>
        </div>
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
    </SetupRequired>
  )
}
