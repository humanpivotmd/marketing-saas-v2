'use client'

import { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toast from '@/components/ui/Toast'
import { CONTENT_CREATE_CHANNELS, TONE_OPTIONS, CONTENT_STYLES, CHANNEL_COLOR_MAP } from '@/lib/constants'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { getToken, authHeaders } from '@/lib/auth-client'

interface Keyword {
  id: string
  keyword: string
  grade: string | null
}

interface BrandVoice {
  id: string
  name: string
  is_default: boolean
}

interface OutlineSection {
  heading: string
  points: string[]
}

interface Outline {
  title: string
  sections: OutlineSection[]
}

interface GenerateResult {
  channel: string
  contentId: string
  title?: string
  body?: string
}

const CHANNELS = CONTENT_CREATE_CHANNELS

const STYLES = CONTENT_STYLES

export default function ContentNewPage() {
  const [step, setStep] = useState(1)
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([])
  const [selectedKeywordId, setSelectedKeywordId] = useState('')
  const [customKeyword, setCustomKeyword] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['blog'])
  const [tone, setTone] = useState('professional')
  const [style, setStyle] = useState('정보 전달')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [brandVoiceId, setBrandVoiceId] = useState('')
  const [outline, setOutline] = useState<Outline | null>(null)
  const [outlineLoading, setOutlineLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressChannel, setProgressChannel] = useState('')
  const [results, setResults] = useState<GenerateResult[]>([])
  const [resultBodies, setResultBodies] = useState<Record<string, string>>({})
  const [activeResultTab, setActiveResultTab] = useState('')
  const { toast, clearToast, showToast, run } = useAsyncAction()
  const [quickMode, setQuickMode] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const token = getToken() || null

  useEffect(() => {
    if (!token) return
    // 키워드 목록
    fetch('/api/keywords?limit=100', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setKeywords(d.data) })
      .catch(() => {})
    // Brand Voice 목록
    fetch('/api/brand-voices', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setBrandVoices(d.data)
          const def = d.data.find((b: BrandVoice) => b.is_default)
          if (def) setBrandVoiceId(def.id)
        }
      })
      .catch(() => {})
  }, [token])

  const getKeyword = () => {
    if (selectedKeywordId) {
      return keywords.find((k) => k.id === selectedKeywordId)?.keyword || ''
    }
    return customKeyword
  }

  const handleOutline = async () => {
    const keyword = getKeyword()
    if (!keyword) return
    setOutlineLoading(true)
    await run(async () => {
      const res = await fetch('/api/generate/outline', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ keyword, brandVoiceId: brandVoiceId || undefined, tone, length }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || '아웃라인 생성 실패')
      setOutline(json.data)
      setStep(2.5)
    }, { errorMessage: '아웃라인 생성 중 오류가 발생했습니다.' })
    setOutlineLoading(false)
  }

  const handleGenerate = async () => {
    const keyword = getKeyword()
    if (!keyword || selectedChannels.length === 0) return
    setGenerating(true)
    setProgress(0)
    setResults([])
    setResultBodies({})
    setStep(3)

    const outlineText = outline
      ? `아웃라인:\n제목: ${outline.title}\n${outline.sections.map((s) => `## ${s.heading}\n${s.points.map((p) => `- ${p}`).join('\n')}`).join('\n')}`
      : ''

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          keywordId: selectedKeywordId || undefined,
          keyword,
          channels: selectedChannels,
          settings: { length, style, tone },
          brandVoiceId: brandVoiceId || undefined,
          outline: outlineText,
        }),
        signal: abortRef.current.signal,
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6))
                if (event.type === 'progress') {
                  setProgress(event.percent)
                  setProgressChannel(event.channel)
                } else if (event.type === 'chunk') {
                  setResultBodies((prev) => ({
                    ...prev,
                    [event.channel]: (prev[event.channel] || '') + event.content,
                  }))
                  if (!activeResultTab) setActiveResultTab(event.channel)
                } else if (event.type === 'channel_done') {
                  setResults((prev) => [...prev, {
                    channel: event.channel,
                    contentId: event.contentId,
                    title: event.title,
                  }])
                } else if (event.type === 'done') {
                  setProgress(100)
                } else if (event.type === 'error') {
                  showToast(`${event.channel}: ${event.message}`, 'error')
                }
              } catch {
                // skip
              }
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        showToast('콘텐츠 생성 중 오류가 발생했습니다.', 'error')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleQuickGenerate = async () => {
    const keyword = getKeyword()
    if (!keyword) return
    setGenerating(true)
    setProgress(0)
    setResults([])
    setResultBodies({})
    setStep(3)

    const quickChannels = ['blog', 'threads', 'instagram']
    setSelectedChannels(quickChannels)
    setTone('professional')
    setLength('medium')
    setStyle('정보 전달')

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          keywordId: selectedKeywordId || undefined,
          keyword,
          channels: quickChannels,
          settings: { length: 'medium', style: '정보 전달', tone: 'professional' },
          brandVoiceId: brandVoiceId || undefined,
        }),
        signal: abortRef.current.signal,
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6))
                if (event.type === 'progress') {
                  setProgress(event.percent)
                  setProgressChannel(event.channel)
                } else if (event.type === 'chunk') {
                  setResultBodies((prev) => ({
                    ...prev,
                    [event.channel]: (prev[event.channel] || '') + event.content,
                  }))
                  if (!activeResultTab) setActiveResultTab(event.channel)
                } else if (event.type === 'channel_done') {
                  setResults((prev) => [...prev, {
                    channel: event.channel,
                    contentId: event.contentId,
                    title: event.title,
                  }])
                } else if (event.type === 'done') {
                  setProgress(100)
                } else if (event.type === 'error') {
                  showToast(`${event.channel}: ${event.message}`, 'error')
                }
              } catch {
                // skip
              }
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        showToast('콘텐츠 생성 중 오류가 발생했습니다.', 'error')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = (channel: string) => {
    const text = resultBodies[channel] || ''
    navigator.clipboard.writeText(text)
    run(async () => {
      // 복사 기록
      const result = results.find((r) => r.channel === channel)
      if (result?.contentId && token) {
        await fetch('/api/publish/clipboard', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ content_id: result.contentId }),
        })
      }
    }, { successMessage: '클립보드에 복사되었습니다.' })
  }

  const GRADE_COLORS: Record<string, string> = {
    'A+': 'bg-emerald-500/15 text-emerald-400', A: 'bg-green-500/15 text-green-400',
    'B+': 'bg-blue-500/15 text-blue-400', B: 'bg-sky-500/15 text-sky-400',
    'C+': 'bg-amber-500/15 text-amber-400', C: 'bg-yellow-500/15 text-yellow-400',
    D: 'bg-red-500/15 text-red-400',
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">콘텐츠 생성</h1>
          <p className="text-sm text-text-secondary mt-1">AI가 키워드 기반 콘텐츠를 생성합니다</p>
        </div>
        {step === 1 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setQuickMode(!quickMode) }}
          >
            {quickMode ? '상세 모드' : '원클릭 생성'}
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-accent-primary text-white' : 'bg-bg-tertiary text-text-tertiary'
            }`}>
              {s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-text-primary' : 'text-text-tertiary'}`}>
              {s === 1 ? '키워드 선택' : s === 2 ? '설정' : '결과'}
            </span>
            {s < 3 && <div className={`w-8 h-px ${step > s ? 'bg-accent-primary' : 'bg-bg-tertiary'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Keyword Selection */}
      {step === 1 && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">키워드 선택</h2>

          {/* Saved Keywords */}
          {keywords.length > 0 && (
            <div className="mb-4">
              <label className="text-sm font-medium text-text-primary mb-2 block">저장된 키워드</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {keywords.map((kw) => (
                  <button
                    key={kw.id}
                    onClick={() => { setSelectedKeywordId(kw.id); setCustomKeyword('') }}
                    className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm min-h-[44px]
                      border transition-all duration-150
                      ${selectedKeywordId === kw.id
                        ? 'border-accent-primary bg-accent-primary/5 text-text-primary'
                        : 'border-[rgba(240,246,252,0.1)] text-text-secondary hover:border-[rgba(240,246,252,0.2)]'}
                    `}
                  >
                    <span className="flex-1 truncate">{kw.keyword}</span>
                    {kw.grade && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${GRADE_COLORS[kw.grade] || 'bg-bg-tertiary text-text-tertiary'}`}>
                        {kw.grade}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[rgba(240,246,252,0.1)]" />
            <span className="text-xs text-text-tertiary">또는</span>
            <div className="flex-1 h-px bg-[rgba(240,246,252,0.1)]" />
          </div>

          <Input
            label="직접 입력"
            placeholder="키워드를 입력하세요"
            value={customKeyword}
            onChange={(e) => { setCustomKeyword(e.target.value); setSelectedKeywordId('') }}
          />

          {/* Channel Selection */}
          <div className="mt-6 mb-2">
            <label className="text-sm font-medium text-text-primary mb-2 block">콘텐츠 유형</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChannels((prev) =>
                      prev.includes(ch.id) ? (prev.length > 1 ? prev.filter((c) => c !== ch.id) : prev) : [...prev, ch.id]
                    )
                  }}
                  className={`
                    flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all min-h-[44px]
                    ${selectedChannels.includes(ch.id) ? (CHANNEL_COLOR_MAP[ch.id] || '') + ' border-current' : 'bg-bg-tertiary text-text-tertiary border-transparent hover:text-text-secondary'}
                  `}
                >
                  {ch.id === 'blog' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>
                  )}
                  {ch.id === 'threads' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12h8M12 8v8"/></svg>
                  )}
                  {ch.id === 'instagram' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
                  )}
                  {ch.id === 'script' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  )}
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-end gap-2">
            <div className="flex justify-end gap-3">
              {quickMode && getKeyword() ? (
                <Button onClick={handleQuickGenerate}>원클릭 생성</Button>
              ) : (
                <Button
                  disabled={!getKeyword()}
                  onClick={() => setStep(2)}
                >
                  다음
                </Button>
              )}
            </div>
            {!getKeyword() && (
              <p className="text-xs text-text-tertiary">키워드를 선택하면 다음 단계로 진행할 수 있습니다</p>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Settings */}
      {step === 2 && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">생성 설정</h2>

          {/* Channels */}
          <div className="mb-6">
            <label className="text-sm font-medium text-text-primary mb-2 block">채널 선택</label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChannels((prev) =>
                      prev.includes(ch.id) ? prev.filter((c) => c !== ch.id) : [...prev, ch.id]
                    )
                  }}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium border transition-all min-h-[44px]
                    ${selectedChannels.includes(ch.id) ? (CHANNEL_COLOR_MAP[ch.id] || '') + ' border-current' : 'bg-bg-tertiary text-text-tertiary border-transparent hover:text-text-secondary'}
                  `}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="mb-6">
            <label className="text-sm font-medium text-text-primary mb-2 block">글자 수</label>
            <div className="flex gap-2">
              {(['short', 'medium', 'long'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  className={`
                    flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all min-h-[44px]
                    ${length === l ? 'border-accent-primary bg-accent-primary/5 text-text-primary' : 'border-[rgba(240,246,252,0.1)] text-text-tertiary hover:text-text-secondary'}
                  `}
                >
                  {l === 'short' ? '짧게 (~500자)' : l === 'medium' ? '보통 (~1000자)' : '길게 (~2000자)'}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="mb-6">
            <label className="text-sm font-medium text-text-primary mb-2 block">스타일</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`
                    px-3 py-2 rounded-lg text-sm border transition-all min-h-[44px]
                    ${style === s ? 'border-accent-primary bg-accent-primary/5 text-text-primary' : 'border-[rgba(240,246,252,0.1)] text-text-tertiary hover:text-text-secondary'}
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="mb-6">
            <label className="text-sm font-medium text-text-primary mb-2 block">톤</label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`
                    px-3 py-2 rounded-lg text-sm border transition-all min-h-[44px]
                    ${tone === t.value ? 'border-accent-primary bg-accent-primary/5 text-text-primary' : 'border-[rgba(240,246,252,0.1)] text-text-tertiary hover:text-text-secondary'}
                  `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Voice */}
          {brandVoices.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-medium text-text-primary mb-2 block">Brand Voice</label>
              <select
                value={brandVoiceId}
                onChange={(e) => setBrandVoiceId(e.target.value)}
                className="w-full h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm"
              >
                <option value="">선택 안함</option>
                {brandVoices.map((bv) => (
                  <option key={bv.id} value={bv.id}>{bv.name}{bv.is_default ? ' (기본)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>이전</Button>
            <div className="flex gap-3">
              {selectedChannels.includes('blog') && (
                <Button variant="secondary" onClick={handleOutline} loading={outlineLoading}>
                  아웃라인 미리보기
                </Button>
              )}
              <Button
                disabled={selectedChannels.length === 0}
                onClick={handleGenerate}
              >
                생성하기
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2.5: Outline Review */}
      {step === 2.5 && outline && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">아웃라인 확인</h2>
          <div className="space-y-3 mb-6">
            <h3 className="text-base font-semibold text-text-primary">{outline.title}</h3>
            {outline.sections.map((section, i) => (
              <div key={i} className="pl-4 border-l-2 border-accent-primary/30">
                <h4 className="text-sm font-medium text-text-primary">{section.heading}</h4>
                <ul className="mt-1 space-y-0.5">
                  {section.points.map((point, j) => (
                    <li key={j} className="text-xs text-text-secondary flex items-start gap-1.5">
                      <span className="text-text-tertiary mt-0.5">-</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>수정하기</Button>
            <Button onClick={handleGenerate}>이 아웃라인으로 생성</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Progress Bar */}
          {generating && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">
                  {progressChannel ? `${CHANNELS.find((c) => c.id === progressChannel)?.label || progressChannel} 생성 중...` : 'AI 생성 중...'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary">{progress}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      abortRef.current?.abort()
                      setGenerating(false)
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--color-accent-primary), #60a5fa)',
                  }}
                />
              </div>
            </Card>
          )}

          {/* Result Tabs */}
          {(results.length > 0 || Object.keys(resultBodies).length > 0) && (
            <Card padding="sm">
              <div className="flex border-b border-[rgba(240,246,252,0.1)] gap-1 mb-4">
                {selectedChannels.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setActiveResultTab(ch)}
                    className={`
                      relative px-4 py-2.5 text-sm font-medium min-h-[44px]
                      transition-colors duration-150
                      ${activeResultTab === ch ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}
                    `}
                  >
                    {CHANNELS.find((c) => c.id === ch)?.label || ch}
                    {results.find((r) => r.channel === ch) && (
                      <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-accent-success inline-block" />
                    )}
                    {activeResultTab === ch && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content Display */}
              <div className="p-4">
                {resultBodies[activeResultTab] ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div
                      className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                      dangerouslySetInnerHTML={{
                        __html: resultBodies[activeResultTab]
                          .replace(/^### (.+)/gm, '<h3>$1</h3>')
                          .replace(/^## (.+)/gm, '<h2>$1</h2>')
                          .replace(/^# (.+)/gm, '<h1>$1</h1>')
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-tertiary text-sm">
                    {generating ? '생성 중...' : '콘텐츠가 없습니다'}
                  </div>
                )}
              </div>

              {/* Actions */}
              {resultBodies[activeResultTab] && (
                <div className="flex justify-end gap-2 p-4 pt-0">
                  <Button variant="secondary" size="sm" onClick={() => handleCopy(activeResultTab)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    복사
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={generating}
                    onClick={async () => {
                      if (!token) return
                      const keyword = getKeyword()
                      const result = results.find((r) => r.channel === activeResultTab)
                      await run(async () => {
                        const res = await fetch('/api/generate/single', {
                          method: 'POST',
                          headers: authHeaders(),
                          body: JSON.stringify({
                            contentId: result?.contentId,
                            keyword,
                            channel: activeResultTab,
                            brandVoiceId: brandVoiceId || undefined,
                            tone,
                            length,
                          }),
                        })
                        const json = await res.json()
                        if (!json.success) throw new Error('재생성 실패')
                        setResultBodies((prev) => ({ ...prev, [activeResultTab]: json.data.body }))
                      }, { successMessage: '재생성 완료', errorMessage: '재생성 실패' })
                    }}
                  >
                    재생성
                  </Button>
                  {results.find((r) => r.channel === activeResultTab)?.contentId && (
                    <a href={`/contents/${results.find((r) => r.channel === activeResultTab)?.contentId}`}>
                      <Button size="sm">상세 보기</Button>
                    </a>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Done actions */}
          {!generating && results.length > 0 && (
            <div className="flex justify-center gap-3">
              <a href="/contents"><Button variant="secondary">콘텐츠 목록</Button></a>
              <Button onClick={() => { setStep(1); setResults([]); setResultBodies({}); setOutline(null) }}>
                새로 생성
              </Button>
            </div>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}
