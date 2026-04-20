'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Toast from '@/components/ui/Toast'
import SetupRequired from '@/components/SetupRequired'
import { getToken, authHeaders } from '@/lib/auth-client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import type { Keyword } from '@/types'
import type { GradeResult } from '@/lib/grade'

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

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyword, setNewKeyword] = useState('')
  const { profile: bizProfile } = useBusinessProfile()
  const serviceName = bizProfile?.service_name || null
  const [includeServiceName, setIncludeServiceName] = useState(true)
  const [searching, setSearching] = useState(false)
  const [gradeResults, setGradeResults] = useState<Record<string, GradeResult>>({})
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'error' as 'error' | 'info' | 'success' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    fetch('/api/keywords', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) setKeywords(data.data)
        else setToast({ visible: true, message: '키워드 목록을 불러오지 못했습니다.', variant: 'error' })
      })
      .catch(() => setToast({ visible: true, message: '키워드 목록을 불러오지 못했습니다.', variant: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  // 검색 = 자동 등록 + 등급 분석
  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!newKeyword.trim()) return
    const token = getToken()
    if (!token) return

    setSearching(true)
    try {
      const keywordText = includeServiceName && serviceName
        ? `${newKeyword.trim()} ${serviceName}`
        : newKeyword.trim()

      // 1. 자동 등록
      const addRes = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword: keywordText }),
      })
      const addData = await addRes.json()
      if (!addData.success) {
        setToast({ visible: true, message: addData.error || '등록에 실패했습니다.', variant: 'error' })
        setSearching(false)
        return
      }

      const newKw: Keyword = addData.data
      setKeywords((prev) => [newKw, ...prev])
      setNewKeyword('')

      // 2. 자동 등급 분석
      const gradeRes = await fetch('/api/keywords/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keywords: [keywordText] }),
      })
      const gradeData = await gradeRes.json()
      if (gradeData.success && gradeData.data.results.length > 0) {
        const result: GradeResult = gradeData.data.results[0]
        setGradeResults((prev) => ({ ...prev, [keywordText]: result }))

        // 키워드 정보 업데이트
        setKeywords((prev) =>
          prev.map((kw) =>
            kw.id === newKw.id
              ? { ...kw, grade: result.grade, monthly_search: result.monthly_search, cpc: result.avg_cpc, last_analyzed: new Date().toISOString() }
              : kw
          )
        )

        // DB 업데이트
        fetch(`/api/keywords/${newKw.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            grade: result.grade,
            monthly_search: result.monthly_search,
            cpc: result.avg_cpc,
            last_analyzed: new Date().toISOString(),
          }),
        }).catch(() => {})

        setExpandedId(newKw.id)
        setToast({ visible: true, message: `"${keywordText}" 등급: ${result.grade} — ${result.opportunity}`, variant: 'success' })
      } else {
        setToast({ visible: true, message: '키워드 등록 완료 (등급 분석 결과 없음)', variant: 'info' })
      }
    } catch {
      setToast({ visible: true, message: '검색 중 오류가 발생했습니다.', variant: 'error' })
    }
    setSearching(false)
  }

  async function handleDelete(ids: string[]) {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch('/api/keywords', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (data.success) {
        setKeywords((prev) => prev.filter((k) => !ids.includes(k.id)))
        setSelectedIds(new Set())
        if (ids.includes(expandedId || '')) setExpandedId(null)
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

  // 인라인 열기 시 등급 분석 실행 (아직 분석되지 않은 경우)
  async function handleExpand(kw: Keyword) {
    if (expandedId === kw.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(kw.id)

    if (kw.grade && gradeResults[kw.keyword]) return
    if (kw.grade) return // 이미 분석됨

    const token = getToken()
    if (!token) return

    try {
      const res = await fetch('/api/keywords/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ keywords: [kw.keyword] }),
      })
      const data = await res.json()
      if (data.success && data.data.results.length > 0) {
        const result: GradeResult = data.data.results[0]
        setGradeResults((prev) => ({ ...prev, [kw.keyword]: result }))
        setKeywords((prev) =>
          prev.map((k) =>
            k.id === kw.id
              ? { ...k, grade: result.grade, monthly_search: result.monthly_search, cpc: result.avg_cpc, last_analyzed: new Date().toISOString() }
              : k
          )
        )
        fetch(`/api/keywords/${kw.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ grade: result.grade, monthly_search: result.monthly_search, cpc: result.avg_cpc, last_analyzed: new Date().toISOString() }),
        }).catch(() => {})
      }
    } catch { /* ignore */ }
  }

  return (
    <SetupRequired>
    <div className="p-4 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">키워드 분석</h1>
        <p className="text-sm text-text-secondary mt-1">
          키워드를 검색하면 자동으로 등록 + 등급 분석이 실행됩니다.
        </p>
        {/* 등급 범례 */}
        <div className="mt-3 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS['A+']}`}>A+~A</span>
            <span className="text-text-secondary">경쟁 치열</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS['B+']}`}>B+~B-</span>
            <span className="text-text-secondary">경쟁 높음</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS['C+']}`}>C+~C-</span>
            <span className="text-text-secondary">도전 가능</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS['D']}`}>D+~D-</span>
            <span className="text-text-secondary">경쟁 낮음</span>
          </span>
        </div>
      </div>

      {/* 검색 폼 */}
      <Card className="mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-4">키워드 검색</h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="키워드 입력 (예: 강남 카페 추천)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              aria-label="키워드"
            />
          </div>
          <Button type="submit" loading={searching}>
            검색
          </Button>
        </form>
        {serviceName && (
          <div className="flex items-center justify-between mt-3 p-3 rounded-lg bg-surface-secondary border border-border-primary">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-tertiary">조합:</span>
              <span className="text-text-primary font-medium">
                {newKeyword || '키워드'} + {serviceName}
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-text-tertiary">서비스명 포함</span>
              <button
                type="button"
                role="switch"
                aria-checked={includeServiceName}
                onClick={() => setIncludeServiceName(v => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${includeServiceName ? 'bg-accent-primary' : 'bg-surface-secondary border border-border-primary'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${includeServiceName ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
        )}
      </Card>

      {/* 키워드 목록 헤더 */}
      <div className="flex items-center justify-between mb-4">
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

      {/* 키워드 리스트 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton variant="title" />
              <Skeleton variant="text" className="mt-2" />
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
          description="키워드를 검색하면 자동으로 등록과 등급 분석이 실행됩니다."
        />
      ) : (
        <div className="space-y-2">
          {keywords.map((kw) => {
            const isExpanded = expandedId === kw.id
            const gradeResult = gradeResults[kw.keyword]

            return (
              <Card key={kw.id} className="overflow-hidden">
                {/* 리스트 행 */}
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => handleExpand(kw)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(kw.id)}
                    onChange={() => toggleSelect(kw.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-[rgba(240,246,252,0.2)] bg-bg-tertiary shrink-0"
                    aria-label={`${kw.keyword} 선택`}
                  />
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{kw.keyword}</h3>
                    {kw.grade && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-lg shrink-0 ${getGradeColor(kw.grade)}`}>
                        {kw.grade}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/create/draft-info?keyword_id=${kw.id}&keyword=${encodeURIComponent(kw.keyword)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 text-xs font-medium bg-accent-primary text-white hover:bg-accent-primary/90 rounded-lg transition-colors min-h-[44px] flex items-center"
                    >
                      콘텐츠 생성
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`"${kw.keyword}" 키워드를 삭제하시겠습니까?`)) {
                          handleDelete([kw.id])
                        }
                      }}
                      className="p-1.5 rounded-md text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`${kw.keyword} 삭제`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      className={`text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M4 6l4 4 4-4" />
                    </svg>
                  </div>
                </div>

                {/* 인라인 상세 (열림/닫힘) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[rgba(240,246,252,0.08)]">
                    {kw.grade || gradeResult ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-text-tertiary">월간 검색량</p>
                          <p className="text-lg font-bold text-text-primary">
                            {(gradeResult?.monthly_search ?? kw.monthly_search) ? (gradeResult?.monthly_search ?? kw.monthly_search)?.toLocaleString() : '정보 없음'}
                          </p>
                          {gradeResult?.monthly_search === 0 && (
                            <p className="text-[10px] text-accent-warning mt-0.5">API 데이터 부족 · 등급 참고용</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary">경쟁도</p>
                          <p className="text-lg font-bold text-text-primary">
                            {gradeResult ? (gradeResult.saturation >= 100 && gradeResult.monthly_search === 0 ? '데이터 없음' : `${gradeResult.saturation.toFixed(1)}%`) : kw.competition || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary">CPC</p>
                          <p className="text-lg font-bold text-text-primary">
                            {(gradeResult?.avg_cpc ?? kw.cpc) ? `${(gradeResult?.avg_cpc ?? kw.cpc)?.toLocaleString()}원` : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary">트렌드</p>
                          <p className={`text-lg font-bold ${
                            gradeResult?.trend === '상승' ? 'text-accent-success' :
                            gradeResult?.trend === '하락' ? 'text-accent-error' :
                            'text-text-primary'
                          }`}>
                            {gradeResult?.trend || '-'}
                            {gradeResult?.trend_change ? ` (${gradeResult.trend_change > 0 ? '+' : ''}${gradeResult.trend_change}%)` : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-text-tertiary">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75" />
                        </svg>
                        등급 분석 중...
                      </div>
                    )}
                    {gradeResult && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-tertiary">
                        <span>난이도: {gradeResult.difficulty}</span>
                        <span>기회: {gradeResult.opportunity}</span>
                        <span>점수: {gradeResult.total_score}점</span>
                        {kw.last_analyzed && (
                          <span>분석: {new Date(kw.last_analyzed).toLocaleDateString('ko-KR')}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Toast
        message={toast.message}
        variant={toast.variant as 'error' | 'info'}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
    </SetupRequired>
  )
}
