'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  admin_reply: string | null
  replied_at: string | null
  created_at: string
}

function getToken() { return sessionStorage.getItem('token') || '' }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }

const STATUS_LABELS: Record<string, string> = {
  open: '접수',
  in_progress: '처리중',
  resolved: '해결',
  closed: '종료',
}

const CATEGORY_OPTIONS = [
  { value: 'general', label: '일반 문의' },
  { value: 'bug', label: '오류 신고' },
  { value: 'billing', label: '결제/요금 문의' },
  { value: 'feature', label: '기능 요청' },
  { value: 'account', label: '계정 관련' },
]

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchTickets = useCallback(() => {
    setLoading(true)
    fetch('/api/support', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => { if (res.success) setTickets(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setToast({ message: '제목과 내용을 모두 입력해주세요.', variant: 'error' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setToast({ message: '문의가 등록되었습니다.', variant: 'success' })
        setSubject('')
        setMessage('')
        fetchTickets()
      } else {
        setToast({ message: data.error || '오류가 발생했습니다.', variant: 'error' })
      }
    } catch {
      setToast({ message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    }
    setSubmitting(false)
  }

  const statusVariant = (s: string) => {
    if (s === 'open') return 'warning' as const
    if (s === 'in_progress') return 'accent' as const
    if (s === 'resolved') return 'success' as const
    return 'default' as const
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">문의하기</h1>

      {/* Submit Form */}
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">새 문의 등록</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">문의 유형</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-4 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="제목"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="문의 제목을 입력해주세요"
          />
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">내용</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 px-4 py-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary placeholder:text-text-tertiary"
              placeholder="문의 내용을 상세히 입력해주세요"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} loading={submitting} disabled={!subject.trim() || !message.trim()}>
              문의 등록
            </Button>
          </div>
        </div>
      </Card>

      {/* My Tickets */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">내 문의 목록</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Card key={i}><div className="h-16 animate-pulse bg-bg-tertiary rounded" /></Card>)}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            title="문의 내역이 없습니다"
            description="궁금한 점이 있으면 위 양식으로 문의해주세요."
          />
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <Card
                key={t.id}
                padding="sm"
                hover
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary truncate">{t.subject}</span>
                      <Badge variant={statusVariant(t.status)} size="sm">
                        {STATUS_LABELS[t.status] || t.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {new Date(t.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={`text-text-tertiary transition-transform ${expandedId === t.id ? 'rotate-180' : ''}`}
                  >
                    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {expandedId === t.id && (
                  <div className="mt-3 pt-3 border-t border-[rgba(240,246,252,0.1)] space-y-3">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">문의 내용</p>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{t.message}</p>
                    </div>
                    {t.admin_reply && (
                      <div className="bg-accent-primary/5 border border-accent-primary/10 rounded-lg p-3">
                        <p className="text-xs text-accent-primary mb-1">
                          답변 ({t.replied_at ? new Date(t.replied_at).toLocaleDateString('ko-KR') : ''})
                        </p>
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{t.admin_reply}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={() => setToast(null)} />}
    </div>
  )
}
