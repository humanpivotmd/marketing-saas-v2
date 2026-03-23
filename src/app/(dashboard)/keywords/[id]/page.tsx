'use client'

import { useState, useEffect, use } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Toast from '@/components/ui/Toast'

interface Keyword {
  id: string
  keyword: string
  grade: string | null
  monthly_search: number | null
  monthly_search_pc: number | null
  monthly_search_mobile: number | null
  competition: string | null
  cpc: number | null
  group_name: string | null
  trend_data: unknown | null
  last_analyzed: string | null
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
  exposure_days: number
  trend: string
  trend_change: number
}

interface SeoScore {
  total: number
  details: {
    titleKeyword: number
    keywordDensity: number
    contentLength: number
    headingStructure: number
    imagePresence: number
    linkPresence: number
    readability: number
  }
  suggestions: string[]
}

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

function getToken(): string | null {
  return sessionStorage.getItem('token')
}

const SEO_LABELS: Record<string, string> = {
  titleKeyword: '제목 키워드',
  keywordDensity: '키워드 밀도',
  contentLength: '콘텐츠 길이',
  headingStructure: '소제목 구조',
  imagePresence: '이미지',
  linkPresence: '링크',
  readability: '가독성',
}

const SEO_MAX: Record<string, number> = {
  titleKeyword: 15,
  keywordDensity: 20,
  contentLength: 15,
  headingStructure: 15,
  imagePresence: 10,
  linkPresence: 10,
  readability: 15,
}

export default function KeywordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [keyword, setKeyword] = useState<Keyword | null>(null)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzingGrade, setAnalyzingGrade] = useState(false)
  const [loadingTrend, setLoadingTrend] = useState(false)
  const [mode, setMode] = useState<'beginner' | 'expert'>('beginner')
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'error' as 'error' | 'info' | 'success' })

  useEffect(() => {
    try {
      const user = sessionStorage.getItem('user')
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
        // Auto-analyze if no grade
        if (!data.data.grade) {
          analyzeGrade(data.data.keyword)
        }
        fetchTrends(data.data.keyword)
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
          r.grade.startsWith('A') ? '이 키워드로 블로그를 쓰면 상위 노출 가능성이 매우 높습니다!' :
          r.grade.startsWith('B') ? '꾸준히 콘텐츠를 올리면 좋은 결과를 기대할 수 있어요.' :
          r.grade.startsWith('C') ? '경쟁이 있지만 차별화된 콘텐츠로 도전해볼 만해요.' :
          '경쟁이 치열해서 다른 키워드를 추천드려요.'

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

      {/* Grade Card + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Grade Card */}
        <Card className={`border ${gradeStyle.border}`}>
          <div className="text-center">
            <p className="text-sm text-text-tertiary mb-2">키워드 등급</p>
            <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center ${gradeStyle.bg} mb-3`}>
              <span className={`text-4xl font-bold ${gradeStyle.text}`}>
                {analyzingGrade ? '...' : grade || '?'}
              </span>
            </div>
            {gradeResult && (
              <>
                <p className="text-sm font-medium text-text-primary">{gradeResult.difficulty}</p>
                <p className="text-xs text-text-tertiary mt-1">기회: {gradeResult.opportunity}</p>
                <p className="text-xs text-text-tertiary">점수: {gradeResult.total_score}점</p>
              </>
            )}
          </div>
        </Card>

        {/* Metrics */}
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            {mode === 'beginner' ? '이 키워드의 핵심 수치' : '검색 지표'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-tertiary">
                {mode === 'beginner' ? '한 달 검색 수' : '월간 검색량'}
              </p>
              <p className="text-xl font-bold text-text-primary">
                {(gradeResult?.monthly_search ?? keyword.monthly_search)?.toLocaleString() || '-'}
              </p>
              {mode === 'beginner' && (
                <p className="text-[10px] text-text-tertiary mt-0.5">많을수록 관심이 높은 키워드</p>
              )}
            </div>
            <div>
              <p className="text-xs text-text-tertiary">
                {mode === 'beginner' ? '관련 글 수' : '월간 발행량'}
              </p>
              <p className="text-xl font-bold text-text-primary">
                {gradeResult?.monthly_publish?.toLocaleString() || '-'}
              </p>
              {mode === 'beginner' && (
                <p className="text-[10px] text-text-tertiary mt-0.5">적을수록 기회가 많아요</p>
              )}
            </div>
            <div>
              <p className="text-xs text-text-tertiary">
                {mode === 'beginner' ? '경쟁 정도' : '포화도'}
              </p>
              <p className="text-xl font-bold text-text-primary">
                {gradeResult ? `${gradeResult.saturation.toFixed(1)}%` : '-'}
              </p>
              {mode === 'beginner' && (
                <p className="text-[10px] text-text-tertiary mt-0.5">낮을수록 노출되기 쉬워요</p>
              )}
            </div>
            <div>
              <p className="text-xs text-text-tertiary">
                {mode === 'beginner' ? '광고 단가' : '평균 CPC'}
              </p>
              <p className="text-xl font-bold text-text-primary">
                {(gradeResult?.avg_cpc ?? keyword.cpc) ? `${(gradeResult?.avg_cpc ?? keyword.cpc)?.toLocaleString()}원` : '-'}
              </p>
              {mode === 'beginner' && (
                <p className="text-[10px] text-text-tertiary mt-0.5">높을수록 가치있는 키워드</p>
              )}
            </div>
          </div>
          {mode === 'expert' && gradeResult && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[rgba(240,246,252,0.1)]">
              <div>
                <p className="text-xs text-text-tertiary">노출 유지 기간</p>
                <p className="text-lg font-semibold text-text-primary">{gradeResult.exposure_days}일</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">트렌드</p>
                <p className={`text-lg font-semibold ${
                  gradeResult.trend === '상승' ? 'text-accent-success' :
                  gradeResult.trend === '하락' ? 'text-accent-error' :
                  'text-text-primary'
                }`}>
                  {gradeResult.trend}
                  {gradeResult.trend_change !== 0 && ` (${gradeResult.trend_change > 0 ? '+' : ''}${gradeResult.trend_change}%)`}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          검색 트렌드 (최근 12개월)
        </h3>
        {loadingTrend ? (
          <Skeleton variant="card" height="200px" />
        ) : trends.length > 0 && trends[0].data.length > 0 ? (
          <div className="relative h-48">
            {/* Simple bar chart */}
            <div className="flex items-end justify-between h-full gap-1">
              {trends[0].data.map((point, i) => {
                const maxRatio = Math.max(...trends[0].data.map((d) => d.ratio), 1)
                const height = (point.ratio / maxRatio) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-accent-primary/30 rounded-t-sm hover:bg-accent-primary/50 transition-colors relative group"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs text-text-primary bg-bg-tertiary px-1.5 py-0.5 rounded whitespace-nowrap">
                        {point.ratio.toFixed(0)}
                      </div>
                    </div>
                    <span className="text-[10px] text-text-tertiary truncate w-full text-center">
                      {point.date.slice(5, 7)}월
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-tertiary text-center py-8">트렌드 데이터가 없습니다.</p>
        )}
      </Card>

      {/* SEO Score - shown in expert mode or when available */}
      {mode === 'expert' && seoScore && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">네이버 SEO 점수</h3>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-accent-primary">{seoScore.total}</span>
              <span className="text-sm text-text-tertiary">/100</span>
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(seoScore.details).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary">{SEO_LABELS[key] || key}</span>
                  <span className="text-text-tertiary">{value}/{SEO_MAX[key] || 15}</span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-primary rounded-full transition-all duration-500"
                    style={{ width: `${(value / (SEO_MAX[key] || 15)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {seoScore.suggestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[rgba(240,246,252,0.1)]">
              <p className="text-xs font-medium text-text-secondary mb-2">개선 제안</p>
              <ul className="space-y-1">
                {seoScore.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-text-tertiary flex items-start gap-2">
                    <span className="text-accent-warning mt-0.5">*</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Keyword Opportunities */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">키워드 기회 추천</h3>
        {opportunities.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-6">
            아직 추천 데이터가 없습니다. 더 많은 키워드를 분석하면 추천이 생성됩니다.
          </p>
        ) : (
          <div className="space-y-2">
            {opportunities.slice(0, 5).map((opp) => (
              <div
                key={opp.keyword}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-primary/50 hover:bg-bg-tertiary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-primary">{opp.keyword}</span>
                  <Badge
                    variant={opp.trend_direction === 'rising' ? 'success' : opp.trend_direction === 'declining' ? 'error' : 'default'}
                    size="sm"
                  >
                    {opp.trend_direction === 'rising' ? '상승' : opp.trend_direction === 'declining' ? '하락' : '안정'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-tertiary">
                  {mode === 'expert' && (
                    <span>검색량 {opp.search_volume?.toLocaleString() || '-'}</span>
                  )}
                  <span className="font-semibold text-accent-primary">{opp.opportunity_score}점</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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
                <a href={`/content/new?keyword=${encodeURIComponent(keyword.keyword)}&topic=${encodeURIComponent(topic)}`}>
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
