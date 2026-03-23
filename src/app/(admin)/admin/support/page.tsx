'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  admin_reply: string | null
  replied_at: string | null
  created_at: string
  users: { email: string; name: string }
}

function getToken() { return sessionStorage.getItem('token') || '' }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }

const STATUS_LABELS: Record<string, string> = {
  open: '접수',
  in_progress: '처리중',
  resolved: '해결',
  closed: '종료',
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const fetchTickets = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)

    fetch(`/api/admin/support?${params}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => { if (res.success) setTickets(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTickets() }, [statusFilter])

  const handleReply = async (id: string, reply: string, status: string) => {
    const res = await fetch('/api/admin/support', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ id, admin_reply: reply, status }),
    })
    const data = await res.json()
    if (data.success) {
      setToast({ message: '답변이 등록되었습니다.', variant: 'success' })
      setSelectedTicket(null)
      fetchTickets()
    } else {
      setToast({ message: data.error || '오류가 발생했습니다.', variant: 'error' })
    }
  }

  const statusVariant = (s: string) => {
    if (s === 'open') return 'warning'
    if (s === 'in_progress') return 'accent'
    if (s === 'resolved') return 'success'
    return 'default'
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">고객 지원</h1>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              statusFilter === s
                ? 'bg-accent-primary text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            {s === '' ? '전체' : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Card key={i}><div className="h-16 animate-pulse bg-bg-tertiary rounded" /></Card>)}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-text-tertiary">문의가 없습니다.</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} padding="sm" hover onClick={() => setSelectedTicket(t)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary truncate">{t.subject}</span>
                    <Badge variant={statusVariant(t.status)} size="sm">{STATUS_LABELS[t.status] || t.status}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    {t.users.name} ({t.users.email}) / {new Date(t.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                {t.admin_reply && (
                  <Badge variant="success" size="sm">답변 완료</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          open
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
          onReply={handleReply}
        />
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={() => setToast(null)} />}
    </div>
  )
}

function TicketDetailModal({ open, onClose, ticket, onReply }: {
  open: boolean
  onClose: () => void
  ticket: Ticket
  onReply: (id: string, reply: string, status: string) => Promise<void>
}) {
  const [reply, setReply] = useState(ticket.admin_reply || '')
  const [status, setStatus] = useState(ticket.status)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await onReply(ticket.id, reply, status)
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="문의 상세" size="lg">
      <div className="space-y-4">
        <div>
          <p className="text-xs text-text-tertiary mb-1">제목</p>
          <p className="text-sm text-text-primary font-medium">{ticket.subject}</p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-1">문의자</p>
          <p className="text-sm text-text-secondary">{ticket.users.name} ({ticket.users.email})</p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-1">문의 내용</p>
          <div className="bg-bg-tertiary/50 rounded-lg p-3 text-sm text-text-primary whitespace-pre-wrap">
            {ticket.message}
          </div>
        </div>

        <div className="border-t border-[rgba(240,246,252,0.1)] pt-4">
          <div className="mb-3">
            <label className="text-sm font-medium text-text-primary block mb-1.5">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm w-full"
            >
              <option value="open">접수</option>
              <option value="in_progress">처리중</option>
              <option value="resolved">해결</option>
              <option value="closed">종료</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">답변</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="w-full h-32 px-4 py-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="답변을 입력하세요"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>닫기</Button>
          <Button onClick={handleSubmit} loading={loading}>답변 등록</Button>
        </div>
      </div>
    </Modal>
  )
}
