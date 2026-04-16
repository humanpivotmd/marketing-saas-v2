'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'
import BottomSheet from '@/components/ui/BottomSheet'
import FlowGuard from '@/components/FlowGuard'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authHeaders } from '@/lib/auth-client'
import {
  CHANNEL_LABEL_MAP,
  AI_TOOL_OPTIONS,
  IMAGE_STYLE_DETAIL_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  IMAGE_SIZE_DEFAULTS,
} from '@/lib/constants'

interface ChannelContent {
  id: string
  channel: string
  title: string | null
  body: string
  hashtags: string[] | null
  status: string
  confirmed_at: string | null
  word_count: number | null
}

interface ImagePromptResult {
  channel: string
  images: { seq: number; description_ko: string; prompt_en: string; placement?: string }[]
  thumbnail?: { description_ko: string; prompt_en: string }
}

export default function ChannelWritePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id') || ''

  const [contents, setContents] = useState<ChannelContent[]>([])
  const [activeChannel, setActiveChannel] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<Record<string, string>>({})
  const [revisionNotes, setRevisionNotes] = useState<Record<string, string>>({})
  const [revising, setRevising] = useState(false)
  const [useMyPrompt, setUseMyPrompt] = useState(true)
  const { toast, clearToast, showToast, run } = useAsyncAction()
  const [, setProjectData] = useState<Record<string, unknown> | null>(null)
  const eventSourceRef = useRef<AbortController | null>(null)

  // BottomSheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetChannel, setSheetChannel] = useState('')
  const [aiTool, setAiTool] = useState<string>('Midjourney')
  const [imageStyle, setImageStyle] = useState<'photo' | 'illustration'>('photo')
  const [styleDetail, setStyleDetail] = useState('미니멀')
  const [imageSize, setImageSize] = useState('')
  const [imageResults, setImageResults] = useState<Record<string, ImagePromptResult>>({})
  const [generatingImage, setGeneratingImage] = useState(false)

  // Track which channels have completed image generation
  const [imageCompleted, setImageCompleted] = useState<Record<string, boolean>>({})

  // BottomSheet view-only mode (프롬프트 보기)
  const [sheetViewOnly, setSheetViewOnly] = useState(false)

  // 발행 메모 날짜
  const [scheduledDates, setScheduledDates] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!projectId) return
    loadProject()
    return () => { eventSourceRef.current?.abort() }
  }, [projectId])

  const loadProject = async () => {
    const res = await fetch(`/api/projects/${projectId}`, { headers: authHeaders() })
    const data = await res.json()
    if (data.success) {
      setProjectData(data.data)
      const existingContents = data.data.contents || []

      // DB에서 이미 생성된 이미지 프롬프트 복원
      const imageScripts = data.data.image_scripts || []
      if (imageScripts.length > 0) {
        const completedMap: Record<string, boolean> = {}
        const resultsMap: Record<string, ImagePromptResult> = {}
        for (const s of imageScripts) {
          completedMap[s.channel] = true
          let thumbnail = undefined
          if (s.thumbnail_prompt) {
            try { thumbnail = typeof s.thumbnail_prompt === 'string' ? JSON.parse(s.thumbnail_prompt) : s.thumbnail_prompt }
            catch { /* ignore */ }
          }
          resultsMap[s.channel] = {
            channel: s.channel,
            images: Array.isArray(s.prompts) ? s.prompts : [],
            thumbnail,
          }
        }
        setImageCompleted(completedMap)
        setImageResults(resultsMap)
      }

      if (existingContents.length > 0) {
        // 채널별로 dedupe — DB에 같은 채널 row가 여러 개 있어도 가장 최근 1개만 사용
        // (created_at 기준 최신순 정렬 후 채널별 첫 번째만 keep)
        const sorted = [...existingContents].sort((a, b) => {
          const ta = new Date(a.created_at || 0).getTime()
          const tb = new Date(b.created_at || 0).getTime()
          return tb - ta
        })
        const seen = new Set<string>()
        const deduped: ChannelContent[] = []
        for (const c of sorted) {
          if (!seen.has(c.channel)) {
            seen.add(c.channel)
            deduped.push(c)
          }
        }
        setContents(deduped)
        if (!activeChannel) setActiveChannel(deduped[0].channel)
      } else {
        startGeneration()
      }
    }
  }

  const startGeneration = async () => {
    setGenerating(true)
    setProgress({})

    try {
      const controller = new AbortController()
      eventSourceRef.current = controller

      const res = await fetch('/api/generate/pipeline', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ project_id: projectId, use_my_prompt: useMyPrompt }),
        signal: controller.signal,
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const event = JSON.parse(line.replace('data: ', ''))

            if (event.type === 'progress') {
              setProgress(p => ({ ...p, [event.channel]: event.message }))
            } else if (event.type === 'channel_done') {
              setProgress(p => ({ ...p, [event.channel]: '완료' }))
            } else if (event.type === 'done') {
              await loadProject()
              setGenerating(false)
            } else if (event.type === 'error') {
              showToast(event.message, 'error')
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        showToast('생성 중 오류 발생', 'error')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleConfirmChannel = async (contentId: string) => {
    await run(async () => {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error || `컨펌 실패 (HTTP ${res.status})`)
      }
      await loadProject()
    }, { successMessage: '컨펌 완료', errorMessage: '컨펌 실패' })
  }

  const handleRevise = async (contentId: string) => {
    const note = revisionNotes[activeChannel] || ''
    if (!note.trim()) return
    setRevising(true)
    try {
      await run(async () => {
        const content = contents.find(c => c.id === contentId)
        if (!content) return

        const res = await fetch('/api/generate/single', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            content_id: contentId,
            revision_note: note,
            project_id: projectId,
          }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)

        setRevisionNotes(prev => ({ ...prev, [activeChannel]: '' }))
        await loadProject()
      }, { successMessage: '재작성 완료', errorMessage: '재작성 실패' })
    } finally {
      setRevising(false)
    }
  }

  // Open BottomSheet for a specific channel (생성 모드)
  const openImageSheet = (channel: string) => {
    setSheetChannel(channel)
    setImageSize(IMAGE_SIZE_DEFAULTS[channel] || '1080x1080')
    setSheetViewOnly(false)
    setSheetOpen(true)
  }

  // Open BottomSheet in view-only mode (프롬프트 보기)
  const openImageView = (channel: string) => {
    setSheetChannel(channel)
    setSheetViewOnly(true)
    setSheetOpen(true)
  }

  // Generate image prompt via API
  const handleGenerateImage = async () => {
    setGeneratingImage(true)
    await run(async () => {
      const res = await fetch('/api/generate/image-script', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          project_id: projectId,
          channel: sheetChannel,
          ai_tool: aiTool,
          image_size: imageSize,
          image_style: imageStyle,
          style_detail: styleDetail,
          use_my_prompt: useMyPrompt,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      const result: ImagePromptResult = {
        channel: sheetChannel,
        images: data.data.images || [],
        thumbnail: data.data.thumbnail || undefined,
      }
      setImageResults(prev => ({ ...prev, [sheetChannel]: result }))
      setImageCompleted(prev => ({ ...prev, [sheetChannel]: true }))
    }, { successMessage: '이미지 프롬프트 생성 완료', errorMessage: '생성 실패' })
    setGeneratingImage(false)
  }

  // Move to next channel in the BottomSheet
  const handleNextChannel = () => {
    const channelTypes = contents.filter(c => c.channel !== 'video_script').map(c => c.channel)
    const currentIdx = channelTypes.indexOf(sheetChannel)
    if (currentIdx < channelTypes.length - 1) {
      const next = channelTypes[currentIdx + 1]
      setSheetChannel(next)
      setImageSize(IMAGE_SIZE_DEFAULTS[next] || '1080x1080')
    } else {
      setSheetOpen(false)
    }
  }

  // 채널 진행 상태 (UI 표시 + 영상 진입 자유도)
  // 정책 (제품팀 회의 결과 2026-04-15):
  //   - "영상 만들기" 버튼은 항상 활성
  //   - 글 0개여도, 부분 컨펌이어도, 이미지 0개여도 영상으로 이동 가능
  //   - 사용자가 결정 (modal/confirm 없음)
  //   - 인라인 상태 표시로 사용자 정보 제공
  const totalChannels = contents.filter(c => c.channel !== 'video_script').length
  const confirmedCount = contents.filter(c => c.confirmed_at && c.channel !== 'video_script').length
  const imageDoneCount = contents
    .filter(c => c.channel !== 'video_script')
    .filter(c => imageCompleted[c.channel]).length

  const handleGoToVideo = async () => {
    await run(async () => {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          current_step: 7,
          step_status: {
            s1: 'completed', s2: 'completed', s3: 'completed',
            s4: 'completed', s5: 'completed', s6: 'completed', s7: 'pending',
          },
        }),
      })
      router.push(`/create/video-script?project_id=${projectId}`)
    }, { successMessage: '영상 단계로 이동', errorMessage: '이동 실패' })
  }

  const activeContent = contents.find(c => c.channel === activeChannel)
  const sizeOptions = IMAGE_SIZE_OPTIONS[sheetChannel] || IMAGE_SIZE_OPTIONS.blog

  return (
    <FlowGuard projectId={projectId} requiredStep={5}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-text-tertiary hover:text-text-secondary">← 이전</button>
          <h1 className="text-xl font-bold text-text-primary">채널별 콘텐츠</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* 마이프롬프트 토글 */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs text-text-tertiary">마이프롬프트</span>
            <button
              role="switch"
              aria-checked={useMyPrompt}
              onClick={() => setUseMyPrompt(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center ${
                useMyPrompt ? 'bg-accent-primary' : 'bg-surface-secondary border border-border-primary'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                useMyPrompt ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </label>

          {!generating && (
            <Button variant="secondary" onClick={startGeneration}>재생성</Button>
          )}

          {/* 영상 만들기 — 항상 활성. 인라인 상태로 사용자에게 정보 제공. */}
          <div className="flex items-center gap-3">
            <Button onClick={handleGoToVideo}>영상 만들기 →</Button>
            {totalChannels > 0 && (
              <span className="text-xs text-text-tertiary">
                글 {confirmedCount}/{totalChannels} 컨펌 · 이미지 {imageDoneCount}/{totalChannels} 생성
                {confirmedCount < totalChannels && (
                  <span className="ml-1">(미완료 항목은 나중에 돌아와 가능)</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 생성 중 프로그레스 */}
      {generating && (
        <Card>
          <div className="space-y-3">
            <p className="text-sm font-medium text-text-primary">채널별 콘텐츠 생성 중...</p>
            {Object.entries(progress).map(([ch, msg]) => (
              <div key={ch} className="flex items-center gap-3 text-sm">
                <span className="w-20 font-medium text-text-secondary">{CHANNEL_LABEL_MAP[ch] || ch}</span>
                <Badge variant={msg === '완료' ? 'success' : 'default'}>{msg}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 채널 탭 */}
      {contents.length > 0 && (
        <>
          <div className="flex border-b border-[rgba(240,246,252,0.1)] gap-1 overflow-x-auto scrollbar-hide">
            {contents.map(c => (
              <button
                key={c.channel}
                onClick={() => setActiveChannel(c.channel)}
                className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                  activeChannel === c.channel ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {CHANNEL_LABEL_MAP[c.channel] || c.channel}
                {c.confirmed_at && imageCompleted[c.channel] && <span className="ml-1 text-green-400">✓</span>}
                {c.confirmed_at && !imageCompleted[c.channel] && <span className="ml-1 text-yellow-400">●</span>}
                {activeChannel === c.channel && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* 콘텐츠 표시 */}
          {activeContent && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {CHANNEL_LABEL_MAP[activeContent.channel]} 콘텐츠
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary">{activeContent.word_count}자</span>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(activeContent.body)
                      showToast('복사됨', 'success')
                    }}>
                      복사
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-surface-secondary text-text-secondary text-sm whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                  {activeContent.body}
                </div>

                {activeContent.hashtags && activeContent.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activeContent.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs text-accent-primary">#{tag}</span>
                    ))}
                  </div>
                )}

                {/* 발행 예정일 메모 */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary border border-border-primary">
                  <span className="text-sm text-text-secondary shrink-0">📅 발행 예정일</span>
                  <input
                    type="date"
                    value={scheduledDates[activeChannel] || ''}
                    onChange={(e) => setScheduledDates(prev => ({ ...prev, [activeChannel]: e.target.value }))}
                    className="py-1.5 px-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary text-sm min-h-[44px]"
                  />
                  {scheduledDates[activeChannel] && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await run(async () => {
                          await fetch(`/api/contents/${activeContent.id}`, {
                            method: 'PUT',
                            headers: authHeaders(),
                            body: JSON.stringify({ scheduled_date: scheduledDates[activeChannel] }),
                          })
                        }, { successMessage: '발행 예정일 저장됨', errorMessage: '저장 실패' })
                      }}
                    >
                      저장
                    </Button>
                  )}
                  <span className="text-xs text-text-tertiary">(선택사항)</span>
                </div>

                {/* 컨펌 + 이미지 만들기 */}
                <div className="flex items-center justify-between border-t border-border-primary pt-4">
                  <span className="text-xs text-text-tertiary">
                    {activeContent.confirmed_at
                      ? imageCompleted[activeContent.channel]
                        ? '✓ 글 확정 + 이미지 완료'
                        : '✓ 글 확정됨'
                      : '아직 컨펌 전'}
                  </span>
                  <div className="flex items-center gap-2">
                    {!activeContent.confirmed_at && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmChannel(activeContent.id)}
                      >
                        이 채널 컨펌
                      </Button>
                    )}
                    {activeContent.confirmed_at && !imageCompleted[activeContent.channel] && (
                      <Button
                        size="sm"
                        onClick={() => openImageSheet(activeContent.channel)}
                      >
                        확정하고 이미지 만들기
                      </Button>
                    )}
                    {activeContent.confirmed_at && imageCompleted[activeContent.channel] && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openImageSheet(activeContent.channel)}
                      >
                        이미지 다시 만들기
                      </Button>
                    )}
                    {activeContent.confirmed_at && imageCompleted[activeContent.channel] && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openImageView(activeContent.channel)}
                      >
                        제작 이미지 프롬프트 보기
                      </Button>
                    )}
                  </div>
                </div>

                {/* 수정/재작성 */}
                <div className="space-y-3">
                  <textarea
                    value={revisionNotes[activeChannel] || ''}
                    onChange={e => setRevisionNotes(prev => ({ ...prev, [activeChannel]: e.target.value }))}
                    placeholder="수정 요청 사항을 입력하세요 (예: 좀 더 캐주얼하게, CTA 강화)"
                    rows={2}
                    className="w-full py-2.5 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm resize-none"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRevise(activeContent.id)}
                    disabled={revising || !(revisionNotes[activeChannel] || '').trim()}
                  >
                    {revising ? '재작성 중...' : '수정 반영하여 재작성'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* 이미지 프롬프트 BottomSheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={sheetViewOnly
          ? `${CHANNEL_LABEL_MAP[sheetChannel] || sheetChannel} 이미지 프롬프트 보기`
          : `${CHANNEL_LABEL_MAP[sheetChannel] || sheetChannel} 이미지 프롬프트`}
      >
        <div className="space-y-5">
          {!sheetViewOnly && (<>
          {/* AI 도구 */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">AI 도구</h4>
            <div className="flex flex-wrap gap-2">
              {AI_TOOL_OPTIONS.map(tool => (
                <button
                  key={tool}
                  onClick={() => setAiTool(tool)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all min-h-[44px] ${
                    aiTool === tool
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-primary text-text-tertiary'
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* 사이즈 */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">사이즈</h4>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setImageSize(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all min-h-[44px] ${
                    imageSize === opt.value
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-primary text-text-tertiary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 이미지 유형 + 스타일 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">이미지 유형</h4>
              <div className="flex gap-2">
                {([{ v: 'photo' as const, l: '실사' }, { v: 'illustration' as const, l: '일러스트' }]).map(o => (
                  <button
                    key={o.v}
                    onClick={() => setImageStyle(o.v)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all min-h-[44px] ${
                      imageStyle === o.v
                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                        : 'border-border-primary text-text-tertiary'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">스타일</h4>
              <select
                value={styleDetail}
                onChange={e => setStyleDetail(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm min-h-[44px]"
              >
                {IMAGE_STYLE_DETAIL_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 마이프롬프트 토글 (시트 내부) */}
          <label className="flex items-center justify-between cursor-pointer select-none py-1">
            <span className="text-sm text-text-secondary">마이프롬프트 적용</span>
            <button
              role="switch"
              aria-checked={useMyPrompt}
              onClick={() => setUseMyPrompt(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center ${
                useMyPrompt ? 'bg-accent-primary' : 'bg-surface-secondary border border-border-primary'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                useMyPrompt ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </label>

          {/* 생성 버튼 */}
          <Button
            className="w-full"
            onClick={handleGenerateImage}
            disabled={generatingImage}
          >
            {generatingImage
              ? '이미지 프롬프트 생성 중...'
              : imageResults[sheetChannel]
                ? '이미지 프롬프트 재생성'
                : '이미지 프롬프트 생성'}
          </Button>
          </>)}

          {/* 결과 */}
          {imageResults[sheetChannel] && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text-primary">
                생성 결과 ({imageResults[sheetChannel].images.length}장)
              </h4>
              {imageResults[sheetChannel].images.map((img, i) => (
                <div key={i} className="p-3 rounded-lg bg-surface-secondary space-y-2">
                  {img.placement && <p className="text-xs text-text-tertiary">{img.placement}</p>}
                  <p className="text-sm text-text-secondary">{img.description_ko}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-accent-primary bg-bg-tertiary p-2 rounded overflow-x-auto">
                      {img.prompt_en}
                    </code>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(img.prompt_en)
                      showToast('복사됨', 'success')
                    }}>
                      복사
                    </Button>
                  </div>
                </div>
              ))}
              {imageResults[sheetChannel].thumbnail && (
                <div className="p-3 rounded-lg bg-accent-primary/5 border border-accent-primary/20 space-y-2">
                  <p className="text-xs text-accent-primary font-medium">썸네일</p>
                  <p className="text-sm text-text-secondary">{imageResults[sheetChannel].thumbnail!.description_ko}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-accent-primary bg-bg-tertiary p-2 rounded overflow-x-auto">
                      {imageResults[sheetChannel].thumbnail!.prompt_en}
                    </code>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(imageResults[sheetChannel].thumbnail!.prompt_en)
                      showToast('복사됨', 'success')
                    }}>
                      복사
                    </Button>
                  </div>
                </div>
              )}

              {/* 다음 채널 버튼 */}
              <Button className="w-full" variant="secondary" onClick={handleNextChannel}>
                {(() => {
                  const channelTypes = contents.filter(c => c.channel !== 'video_script').map(c => c.channel)
                  const idx = channelTypes.indexOf(sheetChannel)
                  if (idx < channelTypes.length - 1) {
                    return `다음 → ${CHANNEL_LABEL_MAP[channelTypes[idx + 1]] || channelTypes[idx + 1]}`
                  }
                  return '완료'
                })()}
              </Button>
            </div>
          )}
        </div>
      </BottomSheet>

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
    </FlowGuard>
  )
}
