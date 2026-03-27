'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import FlowGuard from '@/components/FlowGuard'
import { useAsyncAction } from '@/hooks/useAsyncAction'

const AI_TOOLS = ['Midjourney', 'DALL-E', 'Stable Diffusion', 'Gemini', 'Ideogram', 'Flux']
const STYLES = ['미니멀', '모던', '빈티지', '팝아트', '수채화', '3D', '플랫', '도시적', '세련된']

const SIZE_OPTIONS: Record<string, { label: string; value: string }[]> = {
  blog: [{ label: '1200x630 (썸네일)', value: '1200x630' }, { label: '800x800', value: '800x800' }],
  instagram: [{ label: '1080x1080 (피드)', value: '1080x1080' }, { label: '1080x1920 (스토리)', value: '1080x1920' }],
  threads: [{ label: '1080x1080', value: '1080x1080' }],
  facebook: [{ label: '1200x630', value: '1200x630' }, { label: '1080x1920 (스토리)', value: '1080x1920' }],
}

import { authHeaders } from '@/lib/auth-client'

interface ImagePromptResult {
  channel: string
  images: { seq: number; description_ko: string; prompt_en: string; placement?: string }[]
  thumbnail?: { description_ko: string; prompt_en: string }
}

export default function ImageScriptPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id') || ''

  const [aiTool, setAiTool] = useState('Midjourney')
  const [imageStyle, setImageStyle] = useState<'photo' | 'illustration'>('photo')
  const [styleDetail, setStyleDetail] = useState('미니멀')
  const [results, setResults] = useState<ImagePromptResult[]>([])
  const { loading: generating, toast, clearToast, run } = useAsyncAction()

  const handleGenerate = async () => {
    await run(async () => {
      const res = await fetch(`/api/projects/${projectId}`, { headers: authHeaders() })
      const projData = await res.json()
      if (!projData.success) throw new Error('프로젝트 로드 실패')

      const project = projData.data
      const channels = (project.contents || [])
        .map((c: { type: string }) => c.type)
        .filter((t: string) => t !== 'video_script')

      if (channels.length === 0) {
        throw new Error('채널 콘텐츠가 없습니다. 이전 단계로 돌아가주세요.')
      }
      const generated: ImagePromptResult[] = []

      for (const channel of channels) {
        const sizes = SIZE_OPTIONS[channel] || SIZE_OPTIONS.blog
        const genRes = await fetch('/api/generate/image-script', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            project_id: projectId,
            channel,
            ai_tool: aiTool,
            image_size: sizes[0]?.value || '1080x1080',
            image_style: imageStyle,
            style_detail: styleDetail,
          }),
        })

        const genData = await genRes.json()
        if (genData.success) {
          generated.push({
            channel,
            images: genData.data.images || [],
            thumbnail: genData.data.thumbnail || undefined,
          })
        }
      }

      setResults(generated)
    }, { successMessage: '이미지 프롬프트 생성 완료 (DB 저장됨)', errorMessage: '생성 실패' })
  }

  return (
    <FlowGuard projectId={projectId} requiredStep={6}>
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">이미지 프롬프트 생성</h1>

      {/* 설정 */}
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">AI 도구</h3>
            <div className="flex flex-wrap gap-2">
              {AI_TOOLS.map(tool => (
                <button key={tool} onClick={() => setAiTool(tool)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${aiTool === tool ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-primary text-text-tertiary'}`}
                >{tool}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">이미지 유형</h3>
              <div className="flex gap-2">
                {[{ v: 'photo' as const, l: '실사' }, { v: 'illustration' as const, l: '일러스트' }].map(o => (
                  <button key={o.v} onClick={() => setImageStyle(o.v)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all ${imageStyle === o.v ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-primary text-text-tertiary'}`}
                  >{o.l}</button>
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
        </div>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleGenerate} disabled={generating || !projectId}>
          {generating ? '프롬프트 생성 중...' : '프롬프트 생성'}
        </Button>
      </div>

      {/* 결과 */}
      {results.map(r => (
        <Card key={r.channel}>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            {r.channel === 'blog' ? '블로그' : r.channel === 'instagram' ? '인스타' : r.channel === 'threads' ? 'Threads' : r.channel === 'facebook' ? '페이스북' : r.channel} ({r.images?.length || 0}장)
          </h3>
          <div className="space-y-3">
            {r.images?.map((img, i) => (
              <div key={i} className="p-3 rounded-lg bg-surface-secondary space-y-2">
                <p className="text-xs text-text-tertiary">{img.placement}</p>
                <p className="text-sm text-text-secondary">{img.description_ko}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-accent-primary bg-bg-tertiary p-2 rounded overflow-x-auto">{img.prompt_en}</code>
                  <Button size="sm" variant="ghost" onClick={() => {
                    navigator.clipboard.writeText(img.prompt_en)
                    run(async () => {}, { successMessage: '복사됨' })
                  }}>복사</Button>
                </div>
              </div>
            ))}
            {r.thumbnail && (
              <div className="p-3 rounded-lg bg-accent-primary/5 border border-accent-primary/20 space-y-2">
                <p className="text-xs text-accent-primary font-medium">썸네일</p>
                <p className="text-sm text-text-secondary">{r.thumbnail.description_ko}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-accent-primary bg-bg-tertiary p-2 rounded overflow-x-auto">{r.thumbnail.prompt_en}</code>
                  <Button size="sm" variant="ghost" onClick={() => {
                    navigator.clipboard.writeText(r.thumbnail!.prompt_en)
                    run(async () => {}, { successMessage: '복사됨' })
                  }}>복사</Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}

      {results.length > 0 && (
        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => router.back()}>이전</Button>
          <Button onClick={async () => {
            await fetch(`/api/projects/${projectId}`, {
              method: 'PATCH', headers: authHeaders(),
              body: JSON.stringify({ current_step: 7, step_status: { s1: 'completed', s2: 'completed', s3: 'completed', s4: 'completed', s5: 'completed', s6: 'completed', s7: 'pending' } }),
            })
            router.push(`/create/video-script?project_id=${projectId}`)
          }}>다음 → 영상</Button>
        </div>
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
    </FlowGuard>
  )
}
