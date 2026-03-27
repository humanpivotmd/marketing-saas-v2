'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authHeaders } from '@/lib/auth-client'

interface EmailLog {
  id: string
  to_email: string
  subject: string
  template: string
  status: string
  created_at: string
}

export default function AdminMailPage() {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [history, setHistory] = useState<EmailLog[]>([])
  const { loading: sending, toast, clearToast, run } = useAsyncAction()

  useEffect(() => {
    fetch('/api/admin/mail/history?limit=20', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => { if (res.success) setHistory(res.data) })
      .catch(() => {})
  }, [])

  const handleSend = async () => {
    if (!to || !subject || !body) {
      await run(async () => { throw new Error('모든 필드를 입력해주세요.') })
      return
    }
    await run(async () => {
      const recipients = to.includes(',') ? to.split(',').map((e) => e.trim()) : to.trim()
      const res = await fetch('/api/admin/mail/send', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ to: recipients, subject, body }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '발송에 실패했습니다.')
      setTo('')
      setSubject('')
      setBody('')
      // Refresh history
      const histRes = await fetch('/api/admin/mail/history?limit=20', { headers: authHeaders() })
      const histData = await histRes.json()
      if (histData.success) setHistory(histData.data)
      return data.message
    }, { successMessage: '메일이 발송되었습니다.', errorMessage: '네트워크 오류가 발생했습니다.' })
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">메일 발송</h1>

      {/* Compose */}
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">새 메일 작성</h2>
        <div className="space-y-4">
          <Input
            label="받는 사람"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email@example.com (여러 명은 쉼표로 구분)"
          />
          <Input
            label="제목"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="메일 제목"
          />
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">본문</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-40 px-4 py-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="메일 본문을 입력하세요"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSend} loading={sending}>발송</Button>
          </div>
        </div>
      </Card>

      {/* History */}
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">발송 이력</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(240,246,252,0.1)]">
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">받는 사람</th>
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">제목</th>
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">유형</th>
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">상태</th>
                <th className="text-left py-2 px-3 text-text-tertiary font-medium">발송일</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-text-tertiary">발송 이력이 없습니다.</td></tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="border-b border-[rgba(240,246,252,0.05)] hover:bg-bg-tertiary/30 transition-colors">
                    <td className="py-2.5 px-3 text-text-secondary">{h.to_email}</td>
                    <td className="py-2.5 px-3 text-text-primary">{h.subject}</td>
                    <td className="py-2.5 px-3"><Badge size="sm">{h.template || 'custom'}</Badge></td>
                    <td className="py-2.5 px-3">
                      <Badge variant={h.status === 'sent' ? 'success' : 'error'} size="sm">{h.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-text-tertiary">{new Date(h.created_at).toLocaleString('ko-KR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}
