'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Tabs from '@/components/ui/Tabs'
import Toast from '@/components/ui/Toast'

interface Keyword {
  id: string
  keyword: string
  grade: string | null
  monthly_search: number | null
  competition: string | null
  cpc: number | null
  group_name: string | null
  last_analyzed: string | null
  created_at: string
}

interface GradeResult {
  keyword: string
  grade: string
  difficulty: string
  opportunity: string
  total_score: number
  monthly_search: number
  monthly_publish: number
  saturation: number
  avg_cpc: number
  trend: string
  trend_change: number
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-500/15 text-emerald-400',
  'A': 'bg-green-500/15 text-green-400',
  'A-': 'bg-green-500/15 text-green-300',
  'B+': 'bg-blue-500/15 text-blue-400',
  'B': 'bg-sky-500/15 text-sky-400',
  'B-': 'bg-sky-500/15 text-sky-300',
  'C+': 'bg-amber-500/15 text-amber-400',
  'C': 'bg-yellow-500/15 text-yellow-400',
  'C-': 'bg-yellow-500/15 text-yellow-300',
  'D+': 'bg-orange-500/15 text-orange-400',
  'D': 'bg-red-500/15 text-red-400',
  'D-': 'bg-rose-500/15 text-rose-400',
}

function getGradeColor(grade: string | null): string {
  if (!grade) return 'bg-bg-tertiary text-text-tertiary'
  return GRADE_COLORS[grade] || 'bg-bg-tertiary text-text-tertiary'
}

function getToken(): string | null {
  return sessionStorage.getItem('token')
}

function getExperienceLevel(): string {
  try {
    const user = sessionStorage.getItem('user')
    if (user) {
      const parsed = JSON.parse(user)
      return parsed.experience_level || 'beginner'
    }
  } catch { /* ignore */ }
  return 'beginner'
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyword, setNewKeyword] = useState('')
  const [newGroup, setNewGroup] = useState('')
  const [adding, setAdding] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [gradeResults, setGradeResults] = useState<GradeResult[]>([])
  const [mode, setMode] = useState<'beginner' | 'expert'>('beginner')
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'error' as 'error' | 'info' | 'success' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMode(getExperienceLevel() as 'beginner' | 'expert')
    fetchKeywords()
  }, [])

  async function fetchKeywords() {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch('/api/keywords', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setKeywords(data.data)
      }
    } catch {
      setToast({ visible: true, message: '키워드 목록을 불러오지 못했습니다.', variant: 'error' })
    }
    setLoading(false)
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newKeyword.trim()) return
    const token = getToken()
    if (!token) return

    setAdding(true)
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          group_name: newGroup.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setKeywords((prev) => [data.data, ...prev])
        setNewKeyword('')
        setNewGroup('')
        setToast({ visible: true, message: '키워드가 등록되었습니다.', variant: 'success' })
      } else {
        setToast({ visible: true, message: data.error || '등록에 실패했습니다.', variant: 'error' })
      }
    } catch {
      setToast({ visible: true, message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    }
    setAdding(false)
  }

  async function handleAnalyzeAll() {
    const kws = keywords.map((k) => k.keyword)
    if (kws.length === 0) return
    const token = getToken()
    if (!token) return

    setAnalyzing(true)
    try {
      const res = await fetch('/api/keywords/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keywords: kws.slice(0, 10) }),
      })
      const data = await res.json()
      if (data.success) {
        setGradeResults(data.data.results)
        // Update keywords with grade data
        const gradeMap = new Map<string, GradeResult>(data.data.results.map((r: GradeResult) => [r.keyword, r]))
        setKeywords((prev) =>
          prev.map((kw) => {
            const gr = gradeMap.get(kw.keyword)
            if (gr) {
              return {
                ...kw,
                grade: gr.grade,
                monthly_search: gr.monthly_search,
                cpc: gr.avg_cpc,
                last_analyzed: new Date().toISOString(),
              }
            }
            return kw
          })
        )
        // Also update via API
        for (const kw of keywords) {
          const gr = gradeMap.get(kw.keyword)
          if (gr) {
            fetch(`/api/keywords/${kw.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                grade: gr.grade,
                monthly_search: gr.monthly_search,
                cpc: gr.avg_cpc,
                last_analyzed: new Date().toISOString(),
              }),
            }).catch(() => {})
          }
        }
        const bestKeywords = data.data.results.filter((r: GradeResult) => r.grade.startsWith('A'))
        const analysisMsg = bestKeywords.length > 0
          ? `${data.data.results.length}개 키워드 분석 완료! A등급 키워드 ${bestKeywords.length}개를 추천 탭에서 확인하세요.`
          : `${data.data.results.length}개 키워드 분석 완료`
        setToast({ visible: true, message: analysisMsg, variant: 'success' })
      } else {
        setToast({ visible: true, message: data.error || '분석에 실패했습니다.', variant: 'error' })
      }
    } catch {
      setToast({ visible: true, message: '분석 중 오류가 발생했습니다.', variant: 'error' })
    }
    setAnalyzing(false)
  }

  async function handleDelete(ids: string[]) {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch('/api/keywords', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (data.success) {
        setKeywords((prev) => prev.filter((k) => !ids.includes(k.id)))
        setSelectedIds(new Set())
        setToast({ visible: true, message: '삭제되었습니다.', variant: 'info' })
      }
    } catch {
      setToast({ visible: true, message: '삭제 중 오류가 발생했습니다.', variant: 'error' })
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Beginner mode: natural language description of analysis results
  function renderBeginnerInsight(result: GradeResult) {
    const gradeText =
      result.grade.startsWith('A') ? '아주 좋아요!' :
      result.grade.startsWith('B') ? '괜찮아요.' :
      result.grade.startsWith('C') ? '경쟁이 좀 있어요.' :
      '경쟁이 매우 치열해요.'

    const searchText =
      result.monthly_search >= 10000 ? '많은 사람들이 검색하고 있고' :
      result.monthly_search >= 1000 ? '꾸준히 검색되고 있고' :
      result.monthly_search >= 100 ? '적당한 검색량이 있고' :
      '검색량은 적지만'

    const trendText =
      result.trend === '상승' ? '최근 검색 트렌드도 올라가는 중이에요.' :
      result.trend === '하락' ? '최근 검색 트렌드는 줄어드는 추세에요.' :
      '검색 트렌드는 안정적이에요.'

    return (
      <p className="text-sm text-text-secondary mt-2 leading-relaxed">
        이 키워드는 <strong className="text-text-primary">{gradeText}</strong>{' '}
        월 {result.monthly_search.toLocaleString()}명이 {searchText}{' '}
        {trendText}{' '}
        {result.grade.startsWith('A')
          ? '블로그를 쓰면 상위 노출 가능성이 높아요!'
          : result.grade.startsWith('B')
          ? '꾸준히 콘텐츠를 올리면 충분히 노출될 수 있어요.'
          : '다른 키워드와 함께 사용하면 더 효과적이에요.'}
      </p>
    )
  }

  const keywordListContent = (
    <>
      {/* Add Form */}
      <Card className="mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-4">키워드 등록</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="키워드 입력 (예: 강남 카페 추천)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              aria-label="키워드"
            />
          </div>
          <div className="w-full sm:w-48">
            <Input
              placeholder="그룹 (선택)"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              aria-label="그룹명"
            />
          </div>
          <Button type="submit" loading={adding}>
            등록
          </Button>
        </form>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-text-primary">
            등록된 키워드 <span className="text-text-tertiary font-normal">({keywords.length})</span>
          </h2>
          {selectedIds.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(Array.from(selectedIds))}
            >
              {selectedIds.size}개 삭제
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 bg-bg-tertiary rounded-lg p-0.5">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'beginner'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
              onClick={() => setMode('beginner')}
            >
              초보자
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'expert'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
              onClick={() => setMode('expert')}
            >
              전문가
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={analyzing}
            onClick={handleAnalyzeAll}
            disabled={keywords.length === 0}
          >
            전체 등급 분석
          </Button>
        </div>
      </div>

      {/* Keyword List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton variant="title" />
              <Skeleton variant="text" className="mt-2" />
              <Skeleton variant="text" width="60%" className="mt-1" />
            </Card>
          ))}
        </div>
      ) : keywords.length === 0 ? (
        <EmptyState
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
              <path d="M30 30l-5-5m0 0a7 7 0 10-2-2l5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
          title="등록된 키워드가 없습니다"
          description="키워드를 등록하고 등급 분석을 시작하세요."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keywords.map((kw) => {
            const gradeResult = gradeResults.find((r) => r.keyword === kw.keyword)
            return (
              <Card
                key={kw.id}
                hover
                className="relative cursor-pointer"
                onClick={() => {
                  window.location.href = `/keywords/${kw.id}`
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(kw.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleSelect(kw.id)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 rounded border-[rgba(240,246,252,0.2)] bg-bg-tertiary"
                      aria-label={`${kw.keyword} 선택`}
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{kw.keyword}</h3>
                      {kw.group_name && (
                        <span className="text-xs text-text-tertiary">{kw.group_name}</span>
                      )}
                    </div>
                  </div>
                  {kw.grade && (
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-lg ${getGradeColor(kw.grade)}`}>
                      {kw.grade}
                    </span>
                  )}
                </div>

                {mode === 'beginner' && gradeResult && renderBeginnerInsight(gradeResult)}

                {mode === 'expert' && kw.monthly_search !== null && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-text-tertiary">월간 검색량</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {kw.monthly_search?.toLocaleString() || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">경쟁도</p>
                      <p className="text-sm font-semibold text-text-primary">{kw.competition || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">CPC</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {kw.cpc ? `${kw.cpc.toLocaleString()}원` : '-'}
                      </p>
                    </div>
                  </div>
                )}

                {mode === 'expert' && gradeResult && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <div>
                      <p className="text-xs text-text-tertiary">포화도</p>
                      <p className="text-sm font-semibold text-text-primary">{gradeResult.saturation.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">점수</p>
                      <p className="text-sm font-semibold text-text-primary">{gradeResult.total_score}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">트렌드</p>
                      <p className={`text-sm font-semibold ${
                        gradeResult.trend === '상승' ? 'text-accent-success' :
                        gradeResult.trend === '하락' ? 'text-accent-error' :
                        'text-text-primary'
                      }`}>
                        {gradeResult.trend} {gradeResult.trend_change !== 0 ? `(${gradeResult.trend_change > 0 ? '+' : ''}${gradeResult.trend_change}%)` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">난이도</p>
                      <p className="text-sm font-semibold text-text-primary">{gradeResult.difficulty}</p>
                    </div>
                  </div>
                )}

                {mode === 'beginner' && gradeResult && gradeResult.grade.startsWith('A') && (
                  <div className="mt-2 pt-2 border-t border-[rgba(240,246,252,0.05)]">
                    <a
                      href={`/content/new?keyword=${encodeURIComponent(kw.keyword)}`}
                      className="text-xs text-accent-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      이 키워드로 바로 글 쓰기 &rarr;
                    </a>
                  </div>
                )}

                {!kw.grade && !gradeResult && (
                  <p className="text-xs text-text-tertiary mt-2">
                    아직 분석되지 않았습니다. &quot;전체 등급 분석&quot;을 실행하세요.
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )

  // Recommendations tab
  const recommendationsContent = gradeResults.length === 0 ? (
    <EmptyState
      title="분석 결과가 없습니다"
      description="키워드를 등록하고 '전체 등급 분석'을 실행하면 추천을 받을 수 있습니다."
    />
  ) : (
    <div className="space-y-6">
      {[
        { label: '추천 · 경쟁 낮음 (A등급)', items: gradeResults.filter((r) => r.grade.startsWith('A')), color: 'text-emerald-400' },
        { label: '도전 가능 · 경쟁 보통 (B등급)', items: gradeResults.filter((r) => r.grade.startsWith('B')), color: 'text-blue-400' },
        { label: '차별화 필요 · 경쟁 높음 (C등급)', items: gradeResults.filter((r) => r.grade.startsWith('C')), color: 'text-amber-400' },
        { label: '비추천 · 경쟁 치열 (D등급)', items: gradeResults.filter((r) => r.grade.startsWith('D')), color: 'text-red-400' },
      ].map((group) => group.items.length > 0 && (
        <div key={group.label}>
          <h3 className={`text-sm font-semibold ${group.color} mb-3`}>{group.label}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.items.map((r) => (
              <Card key={r.keyword} padding="sm">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-medium text-text-primary">{r.keyword}</span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${getGradeColor(r.grade)}`}>
                    {r.grade}
                  </span>
                </div>
                {mode === 'beginner' ? (
                  <div className="mt-1 px-2">
                    <p className="text-xs text-text-secondary">{r.opportunity}</p>
                    {r.grade.startsWith('A') && (
                      <a
                        href={`/content/new?keyword=${encodeURIComponent(r.keyword)}`}
                        className="text-xs text-accent-primary hover:underline mt-1 inline-block"
                      >
                        이 키워드로 글 쓰기 &rarr;
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mt-2 px-2 text-xs text-text-tertiary">
                    <span>검색 {r.monthly_search.toLocaleString()}</span>
                    <span>포화 {r.saturation.toFixed(1)}%</span>
                    <span>점수 {r.total_score}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-4 lg:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">키워드 분석</h1>
        <p className="text-sm text-text-secondary mt-1">
          키워드를 등록하고 네이버 검색 데이터 기반 등급 분석을 받으세요.
        </p>
        {/* 등급 범례 */}
        <div className="mt-3 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS['A+']}`}>A+~A</span>
            <span className="text-text-secondary">경쟁 낮음 · 지금 공략!</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS['B+']}`}>B+~B-</span>
            <span className="text-text-secondary">경쟁 보통 · 도전 가능</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS['C+']}`}>C+~C-</span>
            <span className="text-text-secondary">경쟁 높음 · 차별화 필요</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS['D']}`}>D+~D-</span>
            <span className="text-text-secondary">경쟁 치열 · 비추천</span>
          </span>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'keywords', label: '키워드 관리', content: keywordListContent },
          { id: 'recommendations', label: '추천', content: recommendationsContent },
        ]}
      />

      <Toast
        message={toast.message}
        variant={toast.variant as 'error' | 'info'}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  )
}
