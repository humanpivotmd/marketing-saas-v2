'use client'

import { useState, useEffect, use } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Toast from '@/components/ui/Toast'
import type { Keyword } from '@/types'
import type { GradeResult } from '@/lib/grade'
import { getToken } from '@/lib/auth-client'
import TrendChart from './components/TrendChart'
import KeywordMetrics from './components/KeywordMetrics'
import OpportunityList from './components/OpportunityList'

interface TrendData {
  keyword: string
  data: { date: string; ratio: number }[]
}

interface Opportunity {
  keyword: string
  opportunity_score: number
  search_volume: number
  competition_level: string
  trend_direction: string
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'A+': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'A': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  'A-': { bg: 'bg-green-500/10', text: 'text-green-300', border: 'border-green-500/30' },
  'B+': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'B': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  'B-': { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/30' },
  'C+': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'C': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  'C-': { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  'D+': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  'D': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  'D-': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
}

function getGradeStyle(grade: string | null) {
  if (!grade) return { bg: 'bg-bg-tertiary', text: 'text-text-tertiary', border: 'border-[rgba(240,246,252,0.1)]' }
  return GRADE_COLORS[grade] || { bg: 'bg-bg-tertiary', text: 'text-text-tertiary', border: 'border-[rgba(240,246,252,0.1)]' }
}




export default function KeywordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [keyword, setKeyword] = useState<Keyword | null>(null)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzingGrade, setAnalyzingGrade] = useState(false)
  const [loadingTrend, setLoadingTrend] = useState(false)
  const [mode, setMode] = useState<'beginner' | 'expert'>('beginner')
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'error' as 'error' | 'info' | 'success' })

  useEffect(() => {
    try {
      const user = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (user) {
        const parsed = JSON.parse(user)
        setMode(parsed.experience_level === 'expert' ? 'expert' : 'beginner')
      }
    } catch { /* ignore */ }
    fetchKeyword()
    fetchOpportunities()
  }, [id])

  async function fetchKeyword() {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setKeyword(data.data)
        // 병렬 실행: 등급 분석 + 트렌드 조회
        const promises: Promise<void>[] = [fetchTrends(data.data.keyword)]
        if (!data.data.grade) {
          promises.push(analyzeGrade(data.data.keyword))
        }
        await Promise.all(promises)
      }
    } catch {
      setToast({ visible: true, message: '키워드 정보를 불러오지 못했습니다.', variant: 'error' })
    }
    setLoading(false)
  }

  async function analyzeGrade(kw: string) {
    const token = getToken()
    if (!token) return
    setAnalyzingGrade(true)
    try {
      const res = await fetch('/api/keywords/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keywords: [kw] }),
      })
      const data = await res.json()
      if (data.success && data.data.results.length > 0) {
        const result = data.data.results[0]
        setGradeResult(result)
        // Update keyword in DB
        fetch(`/api/keywords/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            grade: result.grade,
            monthly_search: result.monthly_search,
            cpc: result.avg_cpc,
          }),
        }).catch(() => {})
      }
    } catch {
      setToast({ visible: true, message: '등급 분석에 실패했습니다.', variant: 'error' })
    }
    setAnalyzingGrade(false)
  }

  async function fetchTrends(kw: string) {
    const token = getToken()
    if (!token) return
    setLoadingTrend(true)
    try {
      const res = await fetch('/api/keywords/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keywords: [kw], period: 12 }),
      })
      const data = await res.json()
      if (data.success) {
        setTrends(data.data.results)
      }
    } catch {
      setToast({ visible: true, message: '트렌드 데이터를 불러오지 못했습니다.', variant: 'error' })
    }
    setLoadingTrend(false)
  }

  async function fetchOpportunities() {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch('/api/keywords/opportunities?limit=10', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setOpportunities(data.data)
      }
    } catch {
      // Opportunities are non-critical, silently fail
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-6xl">
        <Skeleton variant="title" className="mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" height="200px" />
          <Skeleton variant="card" height="200px" className="lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!keyword) {
    return (
      <div className="p-4 lg:p-8 max-w-6xl">
        <p className="text-text-secondary">키워드를 찾을 수 없습니다.</p>
        <a href="/keywords">
          <Button variant="secondary" size="sm" className="mt-4">목록으로 돌아가기</Button>
        </a>
      </div>
    )
  }

  const grade = gradeResult?.grade || keyword.grade
  const gradeStyle = getGradeStyle(grade)

  // Beginner natural language insight
  const beginnerInsight = gradeResult
    ? (() => {
        const r = gradeResult
        const verdict =
          r.grade.startsWith('D') ? '경쟁은 낮지만 검색량이 적어 노출 효과가 제한적입니다. 타겟 키워드로 활용하세요.' :
          r.grade.startsWith('C') ? '경쟁이 보통 수준이에요. 꾸준히 올리면 좋은 결과를 기대할 수 있어요.' :
          r.grade.startsWith('B') ? '경쟁이 높습니다. 차별화된 콘텐츠가 필요해요.' :
          '경쟁이 매우 치열합니다. 다른 키워드를 추천드려요.'

        return (
          <Card className="mb-6">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${gradeStyle.bg} border ${gradeStyle.border}`}>
                <span className={`text-2xl font-bold ${gradeStyle.text}`}>{r.grade}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  &ldquo;{keyword.keyword}&rdquo; 분석 결과
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">{verdict}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={r.trend === '상승' ? 'success' : r.trend === '하락' ? 'error' : 'default'}>
                    트렌드 {r.trend}
                  </Badge>
                  <Badge variant="accent">
                    월 {r.monthly_search.toLocaleString()}회 검색
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )
      })()
    : null

  return (
    <div className="p-4 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <a href="/keywords" className="text-text-tertiary hover:text-text-secondary transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 4l-6 6 6 6" />
              </svg>
            </a>
            <h1 className="text-2xl font-bold text-text-primary">{keyword.keyword}</h1>
            {grade && (
              <span className={`px-3 py-1 text-lg font-bold rounded-lg ${getGradeStyle(grade).bg} ${getGradeStyle(grade).text}`}>
                {grade}
              </span>
            )}
          </div>
          {keyword.group_name && (
            <span className="text-sm text-text-tertiary ml-8">{keyword.group_name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/create/draft-info?keyword_id=${keyword.id}&keyword=${encodeURIComponent(keyword.keyword)}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            콘텐츠 생성
          </a>
          <div className="flex items-center gap-2 bg-bg-tertiary rounded-lg p-0.5">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'beginner' ? 'bg-accent-primary text-white' : 'text-text-tertiary hover:text-text-secondary'
              }`}
              onClick={() => setMode('beginner')}
            >
              초보자
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'expert' ? 'bg-accent-primary text-white' : 'text-text-tertiary hover:text-text-secondary'
              }`}
              onClick={() => setMode('expert')}
            >
              전문가
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={analyzingGrade}
            onClick={() => analyzeGrade(keyword.keyword)}
          >
            재분석
          </Button>
        </div>
      </div>

      {/* Beginner mode: single insight card */}
      {mode === 'beginner' && beginnerInsight}

      <KeywordMetrics
        keyword={keyword}
        gradeResult={gradeResult}
        mode={mode}
        gradeStyle={gradeStyle}
        analyzingGrade={analyzingGrade}
        grade={grade}
      />

      <TrendChart trends={trends} loading={loadingTrend} />


      <OpportunityList opportunities={opportunities} mode={mode} />

      {/* Blog Topic Suggestions */}
      {gradeResult && (
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">관련 블로그 주제 제안</h3>
          <div className="space-y-2">
            {[
              `${keyword.keyword} 완벽 가이드: 초보자를 위한 A to Z`,
              `${keyword.keyword} 추천 TOP 10 (${new Date().getFullYear()}년 최신)`,
              `${keyword.keyword} 비교 분석: 어떤 것을 선택해야 할까?`,
              `${keyword.keyword} 후기: 직접 경험해본 솔직 리뷰`,
              `${keyword.keyword}로 성공하는 5가지 방법`,
            ].map((topic, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-primary/50 hover:bg-bg-tertiary/30 transition-colors"
              >
                <span className="text-sm text-text-secondary">{topic}</span>
                <a href={`/create/draft-info?keyword=${encodeURIComponent(keyword.keyword)}`}>
                  <Button variant="ghost" size="sm">글 쓰기</Button>
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Toast
        message={toast.message}
        variant={toast.variant as 'error' | 'info'}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  )
}
