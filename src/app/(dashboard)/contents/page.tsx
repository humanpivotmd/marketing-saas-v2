'use client'

import { useState, useEffect, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { CHANNEL_LABEL_MAP, CHANNEL_COLOR_MAP } from '@/lib/constants'
import { getToken, authHeaders } from '@/lib/auth-client'

interface ProjectContent {
  id: string
  channel: string
  title: string | null
  status: string
  confirmed_at: string | null
  seo_score: number | null
  created_at: string
}

interface ProjectItem {
  id: string
  keyword_text: string
  business_type: string
  status: string
  current_step: number
  content_ids: Record<string, string>
  created_at: string
  updated_at: string
  scheduled_date?: string | null
  contents?: ProjectContent[]
  image_channels?: string[]
  has_video?: boolean
  keywords?: { keyword: string; grade: string }
}

type SortKey = 'updated_at' | 'keyword_text'

const CHANNEL_LIST = ['blog', 'instagram', 'threads', 'facebook'] as const

function getChannelStatus(contents: ProjectContent[], imageChannels: string[] = []) {
  return CHANNEL_LIST.map((ch) => {
    const content = contents.find((c) => c.channel === ch)
    const hasText = !!content
    const hasImage = imageChannels.includes(ch)
    return { channel: ch, hasText, hasImage, content }
  })
}

function getScheduledDate(contents: ProjectContent[]): string | null {
  for (const c of contents) {
    const sc = (c as unknown as { scheduled_date?: string }).scheduled_date
    if (sc) return sc
  }
  return null
}

export default function ContentsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('updated_at')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingMemo, setEditingMemo] = useState<string | null>(null)
  const [memoDate, setMemoDate] = useState('')
  const { loading, toast, clearToast, run } = useAsyncAction(true)

  const fetchProjects = async () => {
    // 캐시된 데이터 즉시 표시
    const cached = sessionStorage.getItem('contents_projects')
    if (cached) {
      try { setProjects(JSON.parse(cached)) } catch { /* ignore */ }
    }

    await run(async () => {
      const token = getToken()
      if (!token) throw new Error('로그인이 필요합니다.')
      // include=contents로 1회 호출 (N+1 제거)
      const res = await fetch('/api/projects?limit=50&include=contents', {
        headers: authHeaders(),
      })
      const json = await res.json()
      if (json.success) {
        setProjects(json.data || [])
        sessionStorage.setItem('contents_projects', JSON.stringify(json.data || []))
      }
    }, { errorMessage: '프로젝트 목록을 불러올 수 없습니다.' })
  }

  useEffect(() => { fetchProjects() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  // 발행 메모 날짜 저장
  const handleSaveMemo = async (contentIds: string[]) => {
    if (!memoDate) return
    await run(async () => {
      const token = getToken()
      if (!token) throw new Error('로그인이 필요합니다.')
      // 모든 콘텐츠의 scheduled_date 업데이트
      for (const cid of contentIds) {
        await fetch(`/api/contents/${cid}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ scheduled_date: memoDate }),
        })
      }
      setEditingMemo(null)
      setMemoDate('')
      await fetchProjects()
    }, { successMessage: '발행 메모 저장됨', errorMessage: '저장 실패' })
  }

  // 필터 + 정렬 (메모이제이션)
  const filtered = useMemo(() =>
    projects
      .filter((p) => {
        if (!search) return true
        const kw = (p.keywords?.keyword || p.keyword_text || '').toLowerCase()
        return kw.includes(search.toLowerCase())
      })
      .sort((a, b) => {
        if (sort === 'keyword_text') return (a.keyword_text || '').localeCompare(b.keyword_text || '')
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }),
    [projects, search, sort]
  )

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">콘텐츠</h1>
          <p className="text-sm text-text-secondary mt-1">키워드별로 생성된 콘텐츠를 관리하세요</p>
        </div>
        <a href="/keywords">
          <Button>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            키워드에서 시작하기
          </Button>
        </a>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="키워드 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm"
        >
          <option value="updated_at">최신순</option>
          <option value="keyword_text">키워드순</option>
        </select>
      </div>

      {/* 프로젝트(키워드) 카드 리스트 */}
      {loading && projects.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="40px" />
                  </div>
                  <Skeleton variant="text" width="30%" />
                  <div className="flex gap-2 mt-1">
                    <Skeleton variant="text" width="80px" />
                    <Skeleton variant="text" width="80px" />
                    <Skeleton variant="text" width="80px" />
                  </div>
                </div>
                <Skeleton variant="text" width="60px" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="콘텐츠가 없습니다"
          description="키워드에서 콘텐츠 생성을 시작해보세요"
          action={<a href="/keywords"><Button>키워드에서 시작하기</Button></a>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((proj) => {
            const isExpanded = expandedId === proj.id
            const contents = proj.contents || []
            const channelStatuses = getChannelStatus(contents, proj.image_channels || [])
            const scheduledDate = getScheduledDate(contents)
            const keywordName = proj.keywords?.keyword || proj.keyword_text || '키워드 없음'

            return (
              <Card key={proj.id} className="overflow-hidden">
                {/* 카드 헤더 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-text-primary">{keywordName}</h3>
                      <Badge variant={proj.business_type === 'B2B' ? 'accent' : 'success'}>
                        {proj.business_type}
                      </Badge>
                      {proj.status === 'completed' && (
                        <Badge variant="success">완료</Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      {new Date(proj.created_at).toLocaleDateString('ko-KR')} 생성
                    </p>

                    {/* 채널별 상태 */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {channelStatuses.map((cs) => (
                        <div key={cs.channel} className="flex items-center gap-1 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CHANNEL_COLOR_MAP[cs.channel] || ''}`}>
                            {CHANNEL_LABEL_MAP[cs.channel] || cs.channel}
                          </span>
                          <span>글{cs.hasText ? '✅' : '❌'}</span>
                          <span>·</span>
                          <span>이미지{cs.hasImage ? '✅' : '❌'}</span>
                          {!cs.hasText && cs.content === undefined && (
                            <a
                              href={`/create/channel-write?project_id=${proj.id}`}
                              className="text-accent-primary hover:underline ml-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              [만들기]
                            </a>
                          )}
                        </div>
                      ))}
                      {/* 영상 스크립트 별도 표시 */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CHANNEL_COLOR_MAP['video_script'] || ''}`}>
                          {CHANNEL_LABEL_MAP['video_script'] || '영상'}
                        </span>
                        <span>영상{proj.has_video ? '✅' : '❌'}</span>
                        {proj.has_video ? (
                          <a
                            href={`/create/video-script?project_id=${proj.id}`}
                            className="text-accent-primary hover:underline ml-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            [보기]
                          </a>
                        ) : (
                          <a
                            href={`/create/video-script?project_id=${proj.id}`}
                            className="text-accent-primary hover:underline ml-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            [만들기]
                          </a>
                        )}
                      </div>
                    </div>

                    {/* 발행 메모 */}
                    <div className="flex items-center gap-2 mt-2">
                      {editingMemo === proj.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={memoDate}
                            onChange={(e) => setMemoDate(e.target.value)}
                            className="py-1 px-2 rounded bg-surface-secondary border border-border-primary text-text-primary text-xs"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSaveMemo(contents.map((c) => c.id))}
                          >
                            저장
                          </Button>
                          <button
                            onClick={() => setEditingMemo(null)}
                            className="text-xs text-text-tertiary hover:text-text-secondary"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMemo(proj.id)
                            setMemoDate(scheduledDate || '')
                          }}
                          className="text-xs text-text-tertiary hover:text-accent-primary transition-colors flex items-center gap-1"
                        >
                          <span>📅</span>
                          {scheduledDate
                            ? <span>발행 메모: {scheduledDate}</span>
                            : <span>발행 메모 추가</span>
                          }
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : proj.id)}
                    className="text-xs text-accent-primary hover:underline min-h-[44px] flex items-center shrink-0"
                  >
                    {isExpanded ? '접기' : '전체 보기'}
                  </button>
                </div>

                {/* 펼침 상세 */}
                {isExpanded && contents.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[rgba(240,246,252,0.08)] space-y-2">
                    {contents.map((c) => (
                      <a key={c.id} href={`/contents/${c.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary hover:bg-[rgba(240,246,252,0.06)] transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${CHANNEL_COLOR_MAP[c.channel] || ''}`}>
                              {CHANNEL_LABEL_MAP[c.channel] || c.channel}
                            </span>
                            <span className="text-sm text-text-primary truncate">{c.title || '제목 없음'}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {c.seo_score != null && (
                              <span className="text-xs font-semibold text-accent-primary">SEO {c.seo_score}</span>
                            )}
                            <Badge
                              variant={c.confirmed_at ? 'success' : c.status === 'generated' ? 'default' : 'warning'}
                              size="sm"
                            >
                              {c.confirmed_at ? '확정' : c.status === 'generated' ? '생성됨' : c.status}
                            </Badge>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {isExpanded && contents.length === 0 && (
                  <div className="mt-4 pt-4 border-t border-[rgba(240,246,252,0.08)]">
                    <p className="text-xs text-text-tertiary text-center py-2">아직 생성된 콘텐츠가 없습니다.</p>
                    <div className="flex justify-center mt-2">
                      <a href={`/create/channel-write?project_id=${proj.id}`}>
                        <Button size="sm">콘텐츠 생성하기</Button>
                      </a>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}
