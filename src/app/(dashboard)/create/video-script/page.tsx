'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import ImagePromptSheet from '../components/ImagePromptSheet'
import FlowGuard from '@/components/FlowGuard'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { VIDEO_FORMAT_OPTIONS, VIDEO_CHANNEL_OPTIONS, VIDEO_STYLES } from '@/lib/constants'

const FORMAT_OPTIONS = VIDEO_FORMAT_OPTIONS
const CHANNEL_OPTIONS = VIDEO_CHANNEL_OPTIONS
const STYLES = VIDEO_STYLES

import { authHeaders } from '@/lib/auth-client'

interface Scene {
  scene: number
  duration: number
  visual: string
  narration: string
  text_overlay?: string
  transition: string
}

interface VideoResult {
  title: string
  total_duration: number
  scenes: Scene[]
  bgm_suggestion?: string
  hook?: string
}

export default function VideoScriptPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id') || ''

  const [format, setFormat] = useState('short')
  const [targetChannel, setTargetChannel] = useState('youtube')
  const [sceneCount, setSceneCount] = useState(4)
  const [sceneDuration, setSceneDuration] = useState(5)
  const [imageStyle, setImageStyle] = useState<'photo' | 'illustration'>('photo')
  const [styleDetail, setStyleDetail] = useState('모던')
  const [result, setResult] = useState<VideoResult | null>(null)
  const [activeTab, setActiveTab] = useState<'script' | 'storyboard'>('script')
  const [, setVideoScript] = useState('')
  const [useMyPrompt, setUseMyPrompt] = useState(true)
  const [revisionNote, setRevisionNote] = useState('')
  const [revising, setRevising] = useState(false)
  const [imgSheetOpen, setImgSheetOpen] = useState(false)
  const { loading: generating, toast, clearToast, run } = useAsyncAction()

  // 페이지 진입 시 기존 영상 스크립트 복원
  useEffect(() => {
    if (!projectId) return
    fetch(`/api/projects/${projectId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data.video_script) {
          const vs = data.data.video_script
          if (vs.format) setFormat(vs.format)
          if (vs.target_channel) setTargetChannel(vs.target_channel)
          if (vs.scene_count) setSceneCount(vs.scene_count)
          if (vs.scene_duration) setSceneDuration(vs.scene_duration)
          if (vs.storyboard && vs.storyboard.length > 0) {
            setResult({
              title: '영상 스크립트',
              total_duration: vs.total_duration || (vs.scene_count || 4) * (vs.scene_duration || 5),
              scenes: vs.storyboard,
              hook: vs.hook || undefined,
              bgm_suggestion: vs.bgm_suggestion || undefined,
            })
            if (vs.full_script) setVideoScript(vs.full_script)
          }
        }
      })
      .catch(() => {})
  }, [projectId])

  const handleGenerate = async () => {
    await run(async () => {
      const projRes = await fetch(`/api/projects/${projectId}`, { headers: authHeaders() })
      const projData = await projRes.json()
      if (!projData.success) throw new Error('프로젝트 로드 실패')

      const res = await fetch('/api/generate/video-script', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          project_id: projectId,
          format,
          target_channel: targetChannel,
          scene_count: sceneCount,
          scene_duration: sceneDuration,
          image_style: imageStyle,
          style_detail: styleDetail,
          revision_note: revisionNote || undefined,
          use_my_prompt: useMyPrompt,
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setResult({
        title: data.data.title || '영상 스크립트',
        total_duration: data.data.totalDuration || sceneCount * sceneDuration,
        scenes: data.data.storyboard || [],
      })
      setVideoScript(data.data.full_script || '')
    }, { successMessage: '영상 스크립트 생성 완료 (DB 저장됨)', errorMessage: '생성 실패' })
  }

  const handleComplete = async () => {
    await run(async () => {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          status: 'completed',
          current_step: 7,
          step_status: {
            s1: 'completed', s2: 'completed', s3: 'completed',
            s4: 'completed', s5: 'completed', s6: 'completed',
            s7: 'completed',
          },
        }),
      })
      setTimeout(() => router.push('/contents'), 1000)
    }, { successMessage: '프로젝트 완료', errorMessage: '완료 처리 실패' })
  }



  return (
    <FlowGuard projectId={projectId} requiredStep={6}>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/contents" className="text-sm text-text-tertiary hover:text-text-secondary mb-2 inline-block">← 콘텐츠 목록</Link>
          <h1 className="text-xl font-bold text-text-primary">영상 스크립트</h1>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">영상 유형</h3>
            <div className="flex gap-3">
              {FORMAT_OPTIONS.map(f => (
                <button key={f.value} onClick={() => setFormat(f.value)}
                  className={`flex-1 py-3 px-3 rounded-lg text-sm border transition-all text-left ${format === f.value ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-primary text-text-tertiary'}`}>
                  <div className="font-medium">{f.label}</div>
                  <div className="text-xs mt-0.5 opacity-75">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">대상 채널</h3>
            <div className="flex gap-2">
              {CHANNEL_OPTIONS.map(c => (
                <button key={c.value} onClick={() => setTargetChannel(c.value)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-all ${targetChannel === c.value ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-primary text-text-tertiary'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">장면 수 (1~5)</h3>
              <input type="range" min={1} max={5} value={sceneCount} onChange={e => setSceneCount(parseInt(e.target.value))}
                className="w-full" />
              <span className="text-sm text-text-tertiary">{sceneCount}개</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">장면당 시간 (3~10초)</h3>
              <input type="range" min={3} max={10} value={sceneDuration} onChange={e => setSceneDuration(parseInt(e.target.value))}
                className="w-full" />
              <span className="text-sm text-text-tertiary">{sceneDuration}초 (총 {sceneCount * sceneDuration}초)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">이미지 유형</h3>
              <div className="flex gap-2">
                {[{ v: 'photo' as const, l: '실사' }, { v: 'illustration' as const, l: '일러스트' }].map(o => (
                  <button key={o.v} onClick={() => setImageStyle(o.v)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all ${imageStyle === o.v ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-primary text-text-tertiary'}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">스타일</h3>
              <select value={styleDetail} onChange={e => setStyleDetail(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm">
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* 마이프롬프트 토글 */}
          <div className="flex items-center justify-between pt-2 border-t border-border-primary">
            <span className="text-sm text-text-secondary">마이프롬프트 적용</span>
            <button
              role="switch"
              aria-checked={useMyPrompt}
              onClick={() => setUseMyPrompt(p => !p)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                useMyPrompt ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                useMyPrompt ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleGenerate} disabled={generating || !projectId}>
          {generating ? '스크립트 생성 중...' : '영상 스크립트 생성'}
        </Button>
      </div>

      {/* 결과 */}
      {result && result.scenes?.length > 0 && (
        <>
          {/* 탭 */}
          <div className="flex border-b border-border-primary gap-1">
            {(['script', 'storyboard'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {tab === 'script' ? '영상 글' : '스토리보드'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* 영상 글 탭 */}
          {activeTab === 'script' && (
            <Card>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">영상 나레이션 원고</h3>
                <div className="p-4 rounded-lg bg-surface-secondary text-text-secondary text-sm whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {result.scenes.map(s => s.narration).join('\n\n')}
                </div>
                <div className="border-t border-border-primary pt-4 space-y-3">
                  <textarea
                    value={revisionNote}
                    onChange={e => setRevisionNote(e.target.value)}
                    placeholder="수정 요청 사항을 입력하세요 (예: 더 감성적으로, CTA 강화)"
                    rows={2}
                    className="w-full py-2.5 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm resize-none"
                  />
                  <div className="flex justify-between">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!revisionNote.trim() || revising}
                      onClick={async () => {
                        setRevising(true)
                        try {
                          await handleGenerate()
                          setRevisionNote('')
                        } finally {
                          setRevising(false)
                        }
                      }}
                    >
                      {revising ? '재작성 중...' : '수정 반영하여 재작성'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('storyboard')}
                    >
                      스토리보드 보기
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 스토리보드 탭 */}
          {activeTab === 'storyboard' && (
            <>
              <Card>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{result.title}</h3>
                <p className="text-xs text-text-tertiary mb-4">총 {result.total_duration}초 | {result.scenes.length}장면</p>
                {result.hook && (
                  <div className="p-3 rounded-lg bg-accent-primary/10 text-accent-primary text-sm mb-4">
                    후킹: {result.hook}
                  </div>
                )}
                <div className="space-y-3">
                  {result.scenes.map((s, i) => (
                    <div key={i} className="p-4 rounded-lg bg-surface-secondary border border-border-primary space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary">장면 {s.scene}</span>
                        <span className="text-xs text-text-tertiary">{s.duration}초 | {s.transition}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-text-tertiary">화면</span>
                          <p className="text-text-secondary">{s.visual}</p>
                        </div>
                        <div>
                          <span className="text-xs text-text-tertiary">나레이션</span>
                          <p className="text-text-secondary">{s.narration}</p>
                        </div>
                      </div>
                      {s.text_overlay && (
                        <div>
                          <span className="text-xs text-text-tertiary">자막</span>
                          <p className="text-text-secondary text-sm">{s.text_overlay}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {result.bgm_suggestion && (
                  <p className="text-xs text-text-tertiary mt-3">BGM: {result.bgm_suggestion}</p>
                )}
              </Card>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => router.back()}>이전</Button>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => { setImgSheetOpen(true) }}>이미지 프롬프트</Button>
                  <Button onClick={handleComplete}>프로젝트 완료</Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <ImagePromptSheet
        open={imgSheetOpen}
        onClose={() => setImgSheetOpen(false)}
        projectId={projectId}
        channel="video_script"
        fixedSize={format === 'short' ? '1080x1920' : '1920x1080'}
        imageStyle={imageStyle}
        onGenerated={() => {}}
      />

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
    </FlowGuard>
  )
}
