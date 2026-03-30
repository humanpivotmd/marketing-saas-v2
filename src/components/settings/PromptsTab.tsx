'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PROMPT_STEPS, PROMPT_MODES } from '@/lib/constants'
import { authHeaders } from '@/lib/auth-client'

interface UserPrompt {
  id: string
  step: string
  prompt_text: string
  mode: string
}

export default function PromptsTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [prompts, setPrompts] = useState<UserPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [editStep, setEditStep] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editMode, setEditMode] = useState('combine')

  const fetchPrompts = useCallback(() => {
    setLoading(true)
    fetch('/api/user-prompts', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPrompts(res.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchPrompts() }, [fetchPrompts])

  const handleSave = async (step: string) => {
    try {
      const res = await fetch('/api/user-prompts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ step, prompt_text: editText, mode: editMode }),
      })
      const data = await res.json()
      if (data.success) {
        onToast({ message: '프롬프트가 저장되었습니다.', variant: 'success' })
        setEditStep(null)
        fetchPrompts()
      } else {
        onToast({ message: data.error || '저장 실패', variant: 'error' })
      }
    } catch {
      onToast({ message: '저장 중 오류가 발생했습니다.', variant: 'error' })
    }
  }

  const handleDelete = async (step: string) => {
    try {
      await fetch(`/api/user-prompts?step=${step}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      onToast({ message: '프롬프트가 삭제되었습니다.', variant: 'success' })
      fetchPrompts()
    } catch {
      onToast({ message: '삭제 실패', variant: 'error' })
    }
  }

  const startEdit = (step: string) => {
    const existing = prompts.find((p) => p.step === step)
    setEditStep(step)
    setEditText(existing?.prompt_text || '')
    setEditMode(existing?.mode || 'combine')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">채널별 프롬프트 설정</h2>
        <p className="text-sm text-text-secondary mt-1">각 채널의 콘텐츠 생성 시 적용할 개인 프롬프트를 설정하세요.</p>
      </div>

      {loading ? (
        <p className="text-sm text-text-tertiary">불러오는 중...</p>
      ) : (
        <div className="space-y-3">
          {PROMPT_STEPS.map(({ step, label, description }) => {
            const existing = prompts.find((p) => p.step === step)
            const isEditing = editStep === step

            return (
              <Card key={step}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">{description}</p>

                    {existing && !isEditing && (
                      <div className="mt-3 p-3 bg-bg-tertiary/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge>{PROMPT_MODES.find((m) => m.value === existing.mode)?.label || existing.mode}</Badge>
                        </div>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{existing.prompt_text}</p>
                      </div>
                    )}

                    {isEditing && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1.5">적용 모드</label>
                          <div className="flex gap-2">
                            {PROMPT_MODES.map((m) => (
                              <button
                                key={m.value}
                                onClick={() => setEditMode(m.value)}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                  editMode === m.value
                                    ? 'bg-accent-primary text-white border-accent-primary'
                                    : 'bg-bg-tertiary text-text-secondary border-[rgba(240,246,252,0.1)] hover:border-accent-primary/50'
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="예: 광고 티가 나지 않게, 자연스럽고 친근한 말투로 작성해줘"
                          rows={4}
                          className="w-full px-3 py-2.5 rounded-lg bg-bg-tertiary border border-[rgba(240,246,252,0.1)] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(step)} disabled={!editText.trim()}>저장</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditStep(null)}>취소</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex gap-1 ml-3">
                      <button
                        onClick={() => startEdit(step)}
                        className="px-3 py-1.5 text-xs rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                      >
                        {existing ? '수정' : '설정'}
                      </button>
                      {existing && (
                        <button
                          onClick={() => handleDelete(step)}
                          className="px-3 py-1.5 text-xs rounded-lg text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
