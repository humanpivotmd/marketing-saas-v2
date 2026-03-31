'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { authHeaders } from '@/lib/auth-client'
import { CHANNEL_LABEL_MAP, CHANNEL_COLOR_MAP } from '@/lib/constants'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

function getDotColor(contents: CalendarContent[]): string {
  if (contents.some(c => c.status === 'published')) return 'bg-green-400'
  if (contents.some(c => c.scheduled_date)) return 'bg-blue-400'
  return 'bg-gray-400'
}

interface CalendarContent {
  id: string
  channel: string
  title: string | null
  status: string
  scheduled_date: string
  confirmed_at: string | null
  word_count: number | null
  project_id: string | null
  created_at?: string
  published_at?: string | null
}

// 프로젝트 단위로 그룹핑된 캘린더 아이템
interface CalendarProject {
  project_id: string
  keyword: string
  business_type: string
  contents: CalendarContent[]
  dateType: 'created' | 'memo' | 'published'
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [byDate, setByDate] = useState<Record<string, CalendarContent[]>>({})
  const [projectMap, setProjectMap] = useState<Record<string, { keyword_text: string; business_type: string }>>({})
  const [editingDate, setEditingDate] = useState<{ contentId: string; date: string } | null>(null)
  const { loading, toast, clearToast, run } = useAsyncAction(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchCalendar = useCallback(async () => {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`

    await run(async () => {
      // 병렬 호출: calendar + projects
      const [calRes, projRes] = await Promise.all([
        fetch(`/api/calendar?from=${from}&to=${to}`, { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/projects?limit=100', { headers: authHeaders() }).then(r => r.json()),
      ])

      if (calRes.success) setByDate(calRes.data || {})
      if (projRes.success) {
        const map: Record<string, { keyword_text: string; business_type: string }> = {}
        for (const p of projRes.data || []) {
          map[p.id] = { keyword_text: p.keyword_text || '키워드 없음', business_type: p.business_type || 'B2C' }
        }
        setProjectMap(map)
      }
    })
  }, [year, month, run])

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

  // 날짜 변경
  const handleDateChange = async (contentId: string, newDate: string) => {
    await run(async () => {
      await fetch(`/api/contents/${contentId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ scheduled_date: newDate }),
      })
      setEditingDate(null)
      await fetchCalendar()
    }, { successMessage: '날짜가 변경되었습니다.', errorMessage: '변경 실패' })
  }

  // 프로젝트 그룹핑 메모이제이션
  const projectGroups = useMemo(() => {
    const groups: Record<string, CalendarProject> = {}
    for (const c of selectedContents) {
      const pid = c.project_id || c.id
      if (!groups[pid]) {
        const projInfo = c.project_id ? projectMap[c.project_id] : null
        groups[pid] = {
          project_id: pid,
          keyword: projInfo?.keyword_text || '개별 콘텐츠',
          business_type: projInfo?.business_type || 'B2C',
          contents: [],
          dateType: c.published_at ? 'published' : c.scheduled_date ? 'memo' : 'created',
        }
      }
      groups[pid].contents.push(c)
    }
    return Object.values(groups)
  }, [selectedContents, projectMap])

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">캘린더</h1>
          <p className="text-sm text-text-secondary mt-1">키워드별 콘텐츠 일정을 관리하세요</p>
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
        날짜는 발행 예정 메모입니다. 실제 발행은 직접 SNS에서 해주세요.
      </div>

      {/* 색상 범례 */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span className="text-xs text-text-tertiary">생성일 (자동)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-xs text-text-tertiary">발행 메모 (사용자 설정)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-xs text-text-tertiary">발행 완료</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 캘린더 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4 px-2">
              <button onClick={prevMonth} className="p-2 hover:bg-surface-secondary rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4L6 8l4 4"/></svg>
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-text-primary">{year}년 {month + 1}월</h2>
                <Button size="sm" variant="ghost" onClick={goToday}>오늘</Button>
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-surface-secondary rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-text-tertiary py-2">{d}</div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {calendarDays.map(day => {
                const dateStr = day.month === 'current' ? getDateString(day.date) : ''
                const isToday = dateStr === today
                const isSelected = dateStr === selectedDate
                const dayContents = dateStr ? byDate[dateStr] || [] : []
                const hasContent = dayContents.length > 0

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
                    {/* 색상 점 */}
                    {hasContent && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        <span className={`w-2 h-2 rounded-full ${getDotColor(dayContents)}`} />
                        {dayContents.length > 1 && (
                          <span className="text-[8px] text-text-tertiary ml-0.5">+{dayContents.length - 1}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* 선택된 날짜의 키워드별 콘텐츠 목록 */}
        <div>
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              {selectedDate
                ? `${selectedDate.replace(/-/g, '.')} 일정`
                : '날짜를 선택하세요'
              }
            </h3>
            {!selectedDate ? (
              <p className="text-xs text-text-tertiary py-4 text-center">캘린더에서 날짜를 클릭하면 해당 날짜의 콘텐츠를 볼 수 있습니다.</p>
            ) : projectGroups.length === 0 ? (
              <p className="text-xs text-text-tertiary py-4 text-center">이 날짜에 예정된 콘텐츠가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {projectGroups.map(group => (
                  <div key={group.project_id} className="p-3 rounded-lg bg-surface-secondary">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-text-primary">{group.keyword}</span>
                      <Badge variant={group.business_type === 'B2B' ? 'accent' : 'success'} size="sm">
                        {group.business_type}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {group.contents.map(c => (
                        <div key={c.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${CHANNEL_COLOR_MAP[c.channel] || ''}`}>
                              {CHANNEL_LABEL_MAP[c.channel] || c.channel}
                            </span>
                            <span className="text-xs text-text-secondary truncate">{c.title || '제목 없음'}</span>
                          </div>
                          <Badge
                            variant={c.status === 'published' ? 'success' : c.confirmed_at ? 'accent' : 'default'}
                            size="sm"
                          >
                            {c.status === 'published' ? '발행됨' : c.confirmed_at ? '확정' : '대기'}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* 날짜 변경 */}
                    <div className="mt-2 pt-2 border-t border-[rgba(240,246,252,0.08)]">
                      {editingDate?.contentId === group.contents[0]?.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={editingDate.date}
                            onChange={(e) => setEditingDate({ ...editingDate, date: e.target.value })}
                            className="py-1 px-2 rounded bg-bg-tertiary border border-border-primary text-text-primary text-xs"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              for (const c of group.contents) {
                                handleDateChange(c.id, editingDate.date)
                              }
                            }}
                          >
                            변경
                          </Button>
                          <button onClick={() => setEditingDate(null)} className="text-xs text-text-tertiary">취소</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingDate({ contentId: group.contents[0]?.id, date: selectedDate || '' })}
                          className="text-xs text-accent-primary hover:underline"
                        >
                          날짜 변경
                        </button>
                      )}
                    </div>
                  </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-text-secondary">발행 메모</span>
                  </div>
                  <span className="text-xs font-medium text-text-primary">
                    {Object.values(byDate).flat().filter(c => c.scheduled_date && c.status !== 'published').length}건
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-text-secondary">발행 완료</span>
                  </div>
                  <span className="text-xs font-medium text-text-primary">
                    {Object.values(byDate).flat().filter(c => c.status === 'published').length}건
                  </span>
                </div>
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

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}
