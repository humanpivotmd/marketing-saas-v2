'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'

interface Prompt {
  id: string
  step: string
  version: number
  prompt_text: string
  is_active: boolean
  traffic_ratio: number
  created_at: string
}

const STEPS = [
  { id: 'blog', label: '블로그' },
  { id: 'threads', label: 'Threads' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'script', label: '스크립트' },
  { id: 'image', label: '이미지' },
]

import { authHeaders } from '@/lib/auth-client'

export default function AdminPromptsPage() {
  const [activeStep, setActiveStep] = useState('blog')
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const { loading, toast, clearToast, run } = useAsyncAction(true)

  const fetchPrompts = useCallback(() => {
    run(async () => {
      const res = await fetch(`/api/admin/prompts?step=${activeStep}`, { headers: authHeaders() })
      const json = await res.json()
      if (json.success) setPrompts(json.data)
    })
  }, [activeStep, run])

  useEffect(() => { fetchPrompts() }, [fetchPrompts])

  const handleActivate = async (id: string) => {
    await run(async () => {
      const res = await fetch(`/api/admin/prompts/${id}/activate`, { method: 'POST', headers: authHeaders() })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      fetchPrompts()
    }, { successMessage: '활성화되었습니다.' })
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">프롬프트 관리</h1>
        <Button size="sm" onClick={() => setShowEditor(true)}>새 버전</Button>
      </div>

      {/* Step Tabs */}
      <div className="flex border-b border-[rgba(240,246,252,0.1)] gap-1 overflow-x-auto">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeStep === step.id ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {step.label}
            {activeStep === step.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary rounded-full" />}
          </button>
        ))}
      </div>

      {/* Version List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Card key={i}><div className="h-24 animate-pulse bg-bg-tertiary rounded" /></Card>)}
        </div>
      ) : prompts.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-text-tertiary">
            <p>아직 등록된 프롬프트가 없습니다.</p>
            <Button size="sm" className="mt-3" onClick={() => setShowEditor(true)}>첫 프롬프트 등록</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {prompts.map((p) => (
            <Card key={p.id} padding="sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-text-primary">v{p.version}</span>
                    {p.is_active && <Badge variant="success" size="sm">활성</Badge>}
                    {p.traffic_ratio < 100 && (
                      <Badge variant="accent" size="sm">트래픽 {p.traffic_ratio}%</Badge>
                    )}
                    <span className="text-xs text-text-tertiary">
                      {new Date(p.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <pre className="text-xs text-text-secondary bg-bg-tertiary/50 rounded-lg p-3 overflow-x-auto max-h-32 whitespace-pre-wrap">
                    {p.prompt_text.slice(0, 500)}{p.prompt_text.length > 500 ? '...' : ''}
                  </pre>
                </div>
                {!p.is_active && (
                  <Button variant="secondary" size="sm" onClick={() => handleActivate(p.id)}>
                    활성화
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Prompt Editor */}
      <PromptEditorModal
        open={showEditor}
        onClose={() => setShowEditor(false)}
        step={activeStep}
        onSaved={fetchPrompts}
      />

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}

function PromptEditorModal({ open, onClose, step, onSaved }: {
  open: boolean
  onClose: () => void
  step: string
  onSaved: () => void
}) {
  const [text, setText] = useState('')
  const [trafficRatio, setTrafficRatio] = useState('100')
  const { loading, toast: editorToast, clearToast: clearEditorToast, run: editorRun } = useAsyncAction()

  const handleSubmit = async () => {
    if (!text.trim()) {
      editorRun(async () => { throw new Error('프롬프트 내용을 입력해주세요.') })
      return
    }
    await editorRun(async () => {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ step, prompt_text: text, traffic_ratio: parseInt(trafficRatio) || 100 }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '오류가 발생했습니다.')
      onSaved()
      onClose()
      setText('')
    }, {
      successMessage: '새 버전이 저장되었습니다.',
      errorMessage: '네트워크 오류가 발생했습니다.',
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={`새 프롬프트 (${step})`} size="lg">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">프롬프트 내용</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 px-4 py-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="AI 프롬프트를 입력하세요. {{keyword}}, {{tone}} 등의 변수를 사용할 수 있습니다."
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">A/B 테스트 트래픽 배분 (%)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={trafficRatio}
            onChange={(e) => setTrafficRatio(e.target.value)}
            className="w-32 h-11 px-4 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
          <p className="text-xs text-text-tertiary mt-1">A/B 테스트 시 이 프롬프트에 할당할 트래픽 비율 (기본: 100%)</p>
        </div>
        {editorToast && <Toast message={editorToast.message} variant={editorToast.variant} visible onClose={clearEditorToast} />}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} loading={loading}>저장</Button>
        </div>
      </div>
    </Modal>
  )
}
