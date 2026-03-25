'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'

interface CalendarContent {
  id: string
  type: string
  title: string | null
  status: string
  scheduled_date: string
  confirmed_at: string | null
  word_count: number | null
  project_id: string | null
}

const CH_LABELS: Record<string, string> = {
  blog: '블로그', threads: 'Threads', instagram: '인스타', facebook: '페이스북', video_script: '영상'
}

const CH_COLORS: Record<string, string> = {
  blog: 'bg-green-500/20 text-green-400', threads: 'bg-purple-500/20 text-purple-400',
  instagram: 'bg-pink-500/20 text-pink-400', facebook: 'bg-blue-500/20 text-blue-400',
  video_script: 'bg-orange-500/20 text-orange-400'
}

const CH_DOTS: Record<string, string> = {
  blog: 'bg-green-400', threads: 'bg-purple-400', instagram: 'bg-pink-400',
  facebook: 'bg-blue-400', video_script: 'bg-orange-400'
}

function getToken() { return sessionStorage.getItem('token') || '' }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [byDate, setByDate] = useState<Record<string, CalendarContent[]>>({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: 'success' | 'error' }>({ visible: false, message: '', variant: 'success' })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`

    try {
      const res = await fetch(`/api/calendar?from=${from}&to=${to}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setByDate(data.data || {})
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  // 캘린더 그리드 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const lastDate = new Date(year, month + 1, 0).getDate()
    const prevLastDate = new Date(year, month, 0).getDate()

    const days: { date: number; month: 'prev' | 'current' | 'next'; key: string }[] = []

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: prevLastDate - i, month: 'prev', key: `p${prevLastDate - i}` })
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push({ date: i, month: 'current', key: `c${i}` })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: i, month: 'next', key: `n${i}` })
    }
    return days
  }, [year, month])

  const getDateString = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const today = new Date().toISOString().slice(0, 10)

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(today) }

  const selectedContents = selectedDate ? byDate[selectedDate] || [] : []

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">캘린더</h1>
          <p className="text-sm text-text-secondary mt-1">콘텐츠 발행 일정을 관리하세요</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 캘린더 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4 px-2">
              <button onClick={prevMonth} className="p-2 hover:bg-surface-secondary rounded-lg transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4L6 8l4 4"/></svg>
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-text-primary">{year}년 {month + 1}월</h2>
                <Button size="sm" variant="ghost" onClick={goToday}>오늘</Button>
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-surface-secondary rounded-lg transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
              {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-text-tertiary py-2">{d}</div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {calendarDays.map(day => {
                const dateStr = day.month === 'current' ? getDateString(day.date) : ''
                const isToday = dateStr === today
                const isSelected = dateStr === selectedDate
                const hasContent = dateStr && byDate[dateStr]?.length > 0
                const dayContents = dateStr ? byDate[dateStr] || [] : []

                return (
                  <button
                    key={day.key}
                    onClick={() => dateStr && setSelectedDate(dateStr)}
                    disabled={day.month !== 'current'}
                    className={`relative p-1 min-h-[60px] border border-[rgba(240,246,252,0.04)] transition-colors ${
                      day.month !== 'current' ? 'opacity-30' :
                      isSelected ? 'bg-accent-primary/10 border-accent-primary/30' :
                      isToday ? 'bg-surface-secondary' :
                      'hover:bg-surface-secondary'
                    }`}
                  >
                    <span className={`text-xs font-medium ${
                      isToday ? 'text-accent-primary font-bold' :
                      day.month !== 'current' ? 'text-text-tertiary' : 'text-text-secondary'
                    }`}>
                      {day.date}
                    </span>
                    {/* 채널별 점 표시 */}
                    {hasContent && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {dayContents.slice(0, 4).map((c, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${CH_DOTS[c.type] || 'bg-text-tertiary'}`} />
                        ))}
                        {dayContents.length > 4 && (
                          <span className="text-[8px] text-text-tertiary">+{dayContents.length - 4}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 범례 */}
            <div className="flex flex-wrap gap-3 mt-4 px-2">
              {Object.entries(CH_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${CH_DOTS[key]}`} />
                  <span className="text-xs text-text-tertiary">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 선택된 날짜의 콘텐츠 목록 */}
        <div>
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              {selectedDate
                ? `${selectedDate.replace(/-/g, '.')} 발행 예정`
                : '날짜를 선택하세요'
              }
            </h3>
            {!selectedDate ? (
              <p className="text-xs text-text-tertiary py-4 text-center">캘린더에서 날짜를 클릭하면 해당 날짜의 콘텐츠를 볼 수 있습니다.</p>
            ) : selectedContents.length === 0 ? (
              <p className="text-xs text-text-tertiary py-4 text-center">이 날짜에 예정된 콘텐츠가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {selectedContents.map(c => (
                  <a key={c.id} href={`/contents/${c.id}`}>
                    <div className="p-3 rounded-lg bg-surface-secondary hover:bg-[rgba(240,246,252,0.06)] transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CH_COLORS[c.type] || ''}`}>
                          {CH_LABELS[c.type] || c.type}
                        </span>
                        <Badge variant={c.status === 'confirmed' ? 'success' : 'default'} size="sm">
                          {c.status === 'confirmed' ? '확정' : c.status === 'generated' ? '생성됨' : c.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-primary truncate">{c.title || '제목 없음'}</p>
                      {c.word_count && (
                        <p className="text-xs text-text-tertiary mt-0.5">{c.word_count}자</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </Card>

          {/* 이번 달 요약 */}
          <Card className="mt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">이번 달 요약</h3>
            {loading ? (
              <p className="text-xs text-text-tertiary">로딩 중...</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(CH_LABELS).map(([key, label]) => {
                  const count = Object.values(byDate).flat().filter(c => c.type === key).length
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${CH_DOTS[key]}`} />
                        <span className="text-xs text-text-secondary">{label}</span>
                      </div>
                      <span className="text-xs font-medium text-text-primary">{count}건</span>
                    </div>
                  )
                })}
                <div className="border-t border-border-primary pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">총 예정</span>
                    <span className="text-sm font-bold text-accent-primary">
                      {Object.values(byDate).flat().length}건
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Toast message={toast.message} variant={toast.variant} visible={toast.visible} onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  )
}
