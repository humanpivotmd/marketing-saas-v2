'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authHeaders } from '@/lib/auth-client'
import {
  CHANNEL_LABEL_MAP,
  AI_TOOL_OPTIONS,
  IMAGE_STYLE_DETAIL_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  IMAGE_SIZE_DEFAULTS,
} from '@/lib/constants'

interface ImagePromptResult {
  channel: string
  images: { seq: number; description_ko: string; prompt_en: string; placement?: string }[]
  thumbnail?: { description_ko: string; prompt_en: string }
}

interface ImagePromptSheetProps {
  open: boolean
  onClose: () => void
  projectId: string
  channel: string
  viewOnly?: boolean
  existingResult?: ImagePromptResult | null
  /** 고정 사이즈 (video-script에서 format 기반으로 전달) */
  fixedSize?: string
  imageStyle?: 'photo' | 'illustration'
  useMyPrompt?: boolean
  onGenerated?: (result: ImagePromptResult) => void
}

export default function ImagePromptSheet({
  open, onClose, projectId, channel, viewOnly = false,
  existingResult = null, fixedSize, imageStyle: externalStyle,
  useMyPrompt: externalUseMyPrompt, onGenerated,
}: ImagePromptSheetProps) {
  const [aiTool, setAiTool] = useState('Midjourney')
  const [imageStyle, setImageStyle] = useState<'photo' | 'illustration'>(externalStyle || 'photo')
  const [styleDetail, setStyleDetail] = useState('미니멀')
  const [imageSize, setImageSize] = useState(fixedSize || IMAGE_SIZE_DEFAULTS[channel] || '1080x1080')
  const [useMyPrompt, setUseMyPrompt] = useState(externalUseMyPrompt ?? true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<ImagePromptResult | null>(existingResult)
  const { showToast } = useAsyncAction()

  const sizeOptions = IMAGE_SIZE_OPTIONS[channel] || IMAGE_SIZE_OPTIONS.blog

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate/image-script', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          project_id: projectId,
          channel,
          ai_tool: aiTool,
          image_size: fixedSize || imageSize,
          image_style: imageStyle,
          style_detail: styleDetail,
          use_my_prompt: useMyPrompt,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      const newResult: ImagePromptResult = {
        channel,
        images: data.data.images || [],
        thumbnail: data.data.thumbnail || undefined,
      }
      setResult(newResult)
      onGenerated?.(newResult)
      showToast('이미지 프롬프트 생성 완료', 'success')
    } catch (err) {
      showToast((err as Error).message || '생성 실패', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('복사됨', 'success')
  }

  const displayResult = result || existingResult

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={viewOnly
        ? `${CHANNEL_LABEL_MAP[channel] || channel} 이미지 프롬프트 보기`
        : `${CHANNEL_LABEL_MAP[channel] || channel} 이미지 프롬프트`}
    >
      <div className="space-y-5">
        {!viewOnly && (<>
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">AI 도구</h4>
            <div className="flex flex-wrap gap-2">
              {AI_TOOL_OPTIONS.map(tool => (
                <button key={tool} onClick={() => setAiTool(tool)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all min-h-[44px] ${
                    aiTool === tool
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-primary text-text-tertiary'
                  }`}>{tool}</button>
              ))}
            </div>
          </div>

          {!fixedSize && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">사이즈</h4>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((opt: { value: string; label: string }) => (
                  <button key={opt.value} onClick={() => setImageSize(opt.value)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-all min-h-[44px] ${
                      imageSize === opt.value
                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                        : 'border-border-primary text-text-tertiary'
                    }`}>{opt.label}</button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">이미지 유형</h4>
              <div className="flex gap-2">
                {([{ v: 'photo' as const, l: '실사' }, { v: 'illustration' as const, l: '일러스트' }]).map(o => (
                  <button key={o.v} onClick={() => setImageStyle(o.v)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all min-h-[44px] ${
                      imageStyle === o.v
                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                        : 'border-border-primary text-text-tertiary'
                    }`}>{o.l}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">스타일</h4>
              <select value={styleDetail} onChange={e => setStyleDetail(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-surface-secondary border border-border-primary text-text-primary text-sm min-h-[44px]">
                {IMAGE_STYLE_DETAIL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center justify-between cursor-pointer select-none py-1">
            <span className="text-sm text-text-secondary">마이프롬프트 적용</span>
            <button role="switch" aria-checked={useMyPrompt} onClick={() => setUseMyPrompt(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center ${
                useMyPrompt ? 'bg-accent-primary' : 'bg-surface-secondary border border-border-primary'
              }`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                useMyPrompt ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <Button className="w-full" onClick={handleGenerate} disabled={generating}>
            {generating ? '이미지 프롬프트 생성 중...' : displayResult ? '이미지 프롬프트 재생성' : '이미지 프롬프트 생성'}
          </Button>
        </>)}

        {displayResult && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">
              생성 결과 ({displayResult.images.length}장)
            </h4>
            {displayResult.images.map((img, i) => (
              <div key={i} className="p-3 rounded-lg bg-surface-secondary space-y-2">
                {img.placement && <p className="text-xs text-text-tertiary">{img.placement}</p>}
                <p className="text-sm text-text-secondary">{img.description_ko}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-accent-primary bg-bg-tertiary p-2 rounded overflow-x-auto">
                    {img.prompt_en}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => copyPrompt(img.prompt_en)}>복사</Button>
                </div>
              </div>
            ))}
            {displayResult.thumbnail && (
              <div className="p-3 rounded-lg bg-accent-primary/5 border border-accent-primary/20 space-y-2">
                <p className="text-xs text-accent-primary font-medium">썸네일</p>
                <p className="text-sm text-text-secondary">{displayResult.thumbnail.description_ko}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-accent-primary bg-bg-tertiary p-2 rounded overflow-x-auto">
                    {displayResult.thumbnail.prompt_en}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => copyPrompt(displayResult.thumbnail!.prompt_en)}>복사</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
