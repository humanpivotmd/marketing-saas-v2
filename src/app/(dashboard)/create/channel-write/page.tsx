'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'
import FlowGuard from '@/components/FlowGuard'

interface ChannelContent {
  id: string
  type: string
  title: string | null
  body: string
  hashtags: string[] | null
  status: string
  confirmed_at: string | null
  word_count: number | null
}

const CH_LABELS: Record<string, string> = {
  blog: '블로그', threads: 'Threads', instagram: '인스타그램', facebook: '페이스북'
}

function getToken() { return sessionStorage.getItem('token') || '' }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }

export default function ChannelWritePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id') || ''

  const [contents, setContents] = useState<ChannelContent[]>([])
  const [activeChannel, setActiveChannel] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<Record<string, string>>({})
  const [revisionNote, setRevisionNote] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [revising, setRevising] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [projectData, setProjectData] = useState<Record<string, unknown> | null>(null)
  const eventSourceRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!projectId) return
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    const res = await fetch(`/api/projects/${projectId}`, { headers: authHeaders() })
    const data = await res.json()
    if (data.success) {
      setProjectData(data.data)
      const existingContents = data.data.contents || []
      if (existingContents.length > 0) {
        setContents(existingContents)
        setActiveChannel(existingContents[0].type)
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
        body: JSON.stringify({ project_id: projectId }),
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
              // 프로젝트 다시 로드
              await loadProject()
              setGenerating(false)
            } else if (event.type === 'error') {
              setToast({ message: event.message, variant: 'error' })
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setToast({ message: '생성 중 오류 발생', variant: 'error' })
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleRevise = async (contentId: string) => {
    if (!revisionNote.trim()) return
    setRevising(true)
    try {
      const content = contents.find(c => c.id === contentId)
      if (!content) return

      const res = await fetch('/api/generate/single', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          content_id: contentId,
          revision_note: revisionNote,
          project_id: projectId,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setRevisionNote('')
      setToast({ message: '재작성 완료', variant: 'success' })
      await loadProject()
    } catch (err) {
      setToast({ message: (err as Error).message || '재작성 실패', variant: 'error' })
    } finally {
      setRevising(false)
    }
  }

  const handleConfirmAll = async () => {
    try {
      for (const content of contents) {
        await fetch(`/api/contents/${content.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            scheduled_date: scheduledDate || null,
          }),
        })
      }

      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          confirmed_at: new Date().toISOString(),
          current_step: 6,
        }),
      })

      setToast({ message: '전체 컨펌 완료', variant: 'success' })
      router.push(`/create/image-script?project_id=${projectId}`)
    } catch (err) {
      setToast({ message: (err as Error).message || '컨펌 실패', variant: 'error' })
    }
  }

  const activeContent = contents.find(c => c.type === activeChannel)

  return (
    <FlowGuard projectId={projectId} requiredStep={5}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-text-tertiary hover:text-text-secondary">← 이전</button>
          <h1 className="text-xl font-bold text-text-primary">채널별 콘텐츠</h1>
        </div>
        <div className="flex items-center gap-2">
          {!generating && contents.length === 0 && (
            <Button variant="secondary" onClick={startGeneration}>재생성</Button>
          )}
          {contents.length > 0 && !generating && (
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="py-1.5 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm"
                title="발행 예정일"
              />
              <Button onClick={handleConfirmAll}>전체 컨펌 → 이미지</Button>
            </div>
          )}
        </div>
      </div>

      {/* 생성 중 프로그레스 */}
      {generating && (
        <Card>
          <div className="space-y-3">
            <p className="text-sm font-medium text-text-primary">채널별 콘텐츠 생성 중...</p>
            {Object.entries(progress).map(([ch, msg]) => (
              <div key={ch} className="flex items-center gap-3 text-sm">
                <span className="w-20 font-medium text-text-secondary">{CH_LABELS[ch] || ch}</span>
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
                key={c.type}
                onClick={() => setActiveChannel(c.type)}
                className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeChannel === c.type ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {CH_LABELS[c.type] || c.type}
                {c.confirmed_at && <span className="ml-1 text-green-400">✓</span>}
                {activeChannel === c.type && (
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
                    {CH_LABELS[activeContent.type]} 콘텐츠
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary">{activeContent.word_count}자</span>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(activeContent.body)
                      setToast({ message: '복사됨', variant: 'success' })
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

                {/* 수정/재작성 */}
                <div className="border-t border-border-primary pt-4 space-y-3">
                  <textarea
                    value={revisionNote}
                    onChange={e => setRevisionNote(e.target.value)}
                    placeholder="수정 요청 사항을 입력하세요 (예: 좀 더 캐주얼하게, CTA 강화)"
                    rows={2}
                    className="w-full py-2.5 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm resize-none"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRevise(activeContent.id)}
                    disabled={revising || !revisionNote.trim()}
                  >
                    {revising ? '재작성 중...' : '수정 반영하여 재작성'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      <Toast message={toast?.message || ''} variant={toast?.variant} visible={!!toast} onClose={() => setToast(null)} />
    </div>
    </FlowGuard>
  )
}
