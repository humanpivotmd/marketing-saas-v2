'use client'

import { useState, useEffect, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'

interface Schedule {
  id: string
  content_id: string
  scheduled_at: string
  status: string
  contents: {
    id: string
    title: string | null
    channel: string
    status: string
  } | null
}

interface Content {
  id: string
  title: string | null
  channel: string
  status: string
}

const CHANNEL_COLORS: Record<string, string> = {
  blog: 'bg-blue-500',
  threads: 'bg-gray-400',
  instagram: 'bg-pink-500',
  script: 'bg-green-500',
}

const CHANNEL_DOT_COLORS: Record<string, string> = {
  blog: 'bg-blue-400',
  threads: 'bg-gray-300',
  instagram: 'bg-pink-400',
  script: 'bg-green-400',
}

const CHANNEL_LABELS: Record<string, string> = {
  blog: '블로그', threads: 'Threads', instagram: '인스타', script: '영상',
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [contents, setContents] = useState<Content[]>([])
  const [selectedContentId, setSelectedContentId] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: 'info' | 'success' | 'error' | 'warning' }>({ visible: false, message: '', variant: 'info' })

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 캘린더 날짜 계산
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay()
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

    // 이전 달 패딩
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false })
    }
    // 이번 달
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true })
    }
    // 다음 달 패딩 (6줄 채우기)
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }, [year, month])

  const fetchSchedules = async () => {
    if (!token) return
    setLoading(true)
    const from = new Date(year, month, 1).toISOString()
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    try {
      const res = await fetch(`/api/schedules?from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) setSchedules(json.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [year, month, token])

  const fetchContents = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/contents?status=generated&limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) setContents(json.data)
    } catch {
      // ignore
    }
  }

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return schedules.filter((s) => s.scheduled_at.startsWith(dateStr))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1))
  const handleToday = () => setCurrentDate(new Date())

  const handleDateClick = (date: Date) => {
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const openScheduleModal = () => {
    fetchContents()
    setShowScheduleModal(true)
  }

  const handleCreateSchedule = async () => {
    if (!token || !selectedContentId || !selectedDate) return

    const scheduledAt = new Date(`${selectedDate}T${scheduleTime}:00`).toISOString()

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content_id: selectedContentId, scheduled_at: scheduledAt }),
      })
      const json = await res.json()
      if (json.success) {
        setShowScheduleModal(false)
        setSelectedContentId('')
        fetchSchedules()
        setToast({ visible: true, message: '예약이 등록되었습니다.', variant: 'success' })
      } else {
        setToast({ visible: true, message: json.error || '예약 등록 실패', variant: 'error' })
      }
    } catch {
      setToast({ visible: true, message: '예약 등록 중 오류가 발생했습니다.', variant: 'error' })
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!token) return
    try {
      await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId))
      setToast({ visible: true, message: '스케줄이 삭제되었습니다.', variant: 'success' })
    } catch {
      setToast({ visible: true, message: '삭제에 실패했습니다.', variant: 'error' })
    }
  }

  // 오늘 발행할 콘텐츠
  const todayStr = new Date().toISOString().split('T')[0]
  const todaySchedules = schedules.filter((s) => s.scheduled_at.startsWith(todayStr))

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">캘린더</h1>
              <p className="text-sm text-text-secondary mt-1">발행 스케줄을 관리하세요</p>
            </div>
            <Button size="sm" onClick={openScheduleModal} className="shrink-0">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
              예약 등록
            </Button>
          </div>

          {/* Month Navigation */}
          <Card padding="sm">
            <div className="flex items-center justify-between mb-4 px-2 pt-2">
              <button onClick={handlePrevMonth} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-text-primary">
                  {year}년 {month + 1}월
                </h2>
                <Button variant="ghost" size="sm" onClick={handleToday}>오늘</Button>
              </div>
              <button onClick={handleNextMonth} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-text-tertiary py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-[rgba(240,246,252,0.05)]">
              {calendarDays.map(({ date, isCurrentMonth }, i) => {
                const daySchedules = getSchedulesForDate(date)
                const dateStr = date.toISOString().split('T')[0]
                const isSelected = selectedDate === dateStr

                return (
                  <button
                    key={i}
                    onClick={() => handleDateClick(date)}
                    className={`
                      min-h-[80px] p-1.5 text-left transition-colors
                      ${isCurrentMonth ? 'bg-bg-secondary' : 'bg-bg-primary/50'}
                      ${isSelected ? 'ring-2 ring-accent-primary ring-inset' : ''}
                      ${isToday(date) ? 'bg-accent-primary/5' : ''}
                      hover:bg-bg-tertiary/50
                    `}
                  >
                    <span className={`
                      inline-flex items-center justify-center w-6 h-6 text-xs rounded-full
                      ${isToday(date) ? 'bg-accent-primary text-white font-bold' : isCurrentMonth ? 'text-text-primary' : 'text-text-tertiary'}
                    `}>
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {daySchedules.slice(0, 3).map((s) => (
                        <div key={s.id} className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${CHANNEL_DOT_COLORS[s.contents?.channel || ''] || 'bg-gray-400'}`} />
                          <span className="text-[10px] text-text-secondary truncate">
                            {s.contents?.title || '제목 없음'}
                          </span>
                        </div>
                      ))}
                      {daySchedules.length > 3 && (
                        <span className="text-[10px] text-text-tertiary">+{daySchedules.length - 3}개</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Channel Legend */}
            <div className="flex items-center gap-4 px-2 py-3">
              {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${CHANNEL_DOT_COLORS[key]}`} />
                  <span className="text-xs text-text-tertiary">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          {/* Today Panel */}
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">오늘 발행할 콘텐츠</h3>
            {todaySchedules.length === 0 ? (
              <p className="text-xs text-text-tertiary py-4 text-center">오늘 예정된 콘텐츠가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {todaySchedules.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${CHANNEL_DOT_COLORS[s.contents?.channel || '']}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{s.contents?.title || '제목 없음'}</p>
                      <p className="text-[10px] text-text-tertiary">
                        {new Date(s.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge size="sm" variant={s.status === 'published' ? 'success' : 'default'}>
                      {s.status === 'published' ? '완료' : '대기'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Selected Date Panel */}
          {selectedDate && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </h3>
                <Button size="sm" variant="ghost" onClick={openScheduleModal}>+ 추가</Button>
              </div>
              {getSchedulesForDate(new Date(selectedDate + 'T00:00:00')).length === 0 ? (
                <p className="text-xs text-text-tertiary py-4 text-center">예정된 콘텐츠가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {getSchedulesForDate(new Date(selectedDate + 'T00:00:00')).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${CHANNEL_DOT_COLORS[s.contents?.channel || '']}`} />
                      <a href={`/contents/${s.content_id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                        <p className="text-xs font-medium text-text-primary truncate">{s.contents?.title || '제목 없음'}</p>
                        <p className="text-[10px] text-text-tertiary">
                          {CHANNEL_LABELS[s.contents?.channel || '']} · {new Date(s.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </a>
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        className="text-text-tertiary hover:text-accent-error min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label="삭제"
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M1 1l12 12M13 1L1 13" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Queue */}
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">발행 큐</h3>
            {schedules.filter((s) => s.status === 'pending').length === 0 ? (
              <p className="text-xs text-text-tertiary py-4 text-center">대기 중인 발행이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {schedules
                  .filter((s) => s.status === 'pending')
                  .slice(0, 5)
                  .map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${CHANNEL_DOT_COLORS[s.contents?.channel || '']}`} />
                      <span className="flex-1 text-text-secondary truncate">{s.contents?.title || '제목 없음'}</span>
                      <span className="text-text-tertiary shrink-0">
                        {new Date(s.scheduled_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="발행 예약"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">콘텐츠 선택</label>
            <select
              value={selectedContentId}
              onChange={(e) => setSelectedContentId(e.target.value)}
              className="w-full h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm"
            >
              <option value="">콘텐츠를 선택하세요</option>
              {contents.map((c) => (
                <option key={c.id} value={c.id}>
                  [{CHANNEL_LABELS[c.channel] || c.channel}] {c.title || '제목 없음'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">날짜</label>
            <input
              type="date"
              value={selectedDate || ''}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">시간</label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>취소</Button>
            <Button disabled={!selectedContentId || !selectedDate} onClick={handleCreateSchedule}>
              예약 등록
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  )
}
