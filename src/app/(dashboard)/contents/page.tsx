'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Toast from '@/components/ui/Toast'

interface Content {
  id: string
  keyword: string | null
  channel: string
  title: string | null
  seo_score: number | null
  status: string
  created_at: string
  published_at: string | null
}

const CHANNEL_TABS = [
  { id: 'all', label: '전체' },
  { id: 'blog', label: '블로그' },
  { id: 'threads', label: 'Threads' },
  { id: 'instagram', label: '인스타그램' },
  { id: 'script', label: '영상 스크립트' },
]

const CHANNEL_COLORS: Record<string, string> = {
  blog: 'bg-blue-500/15 text-blue-400',
  threads: 'bg-gray-500/15 text-gray-300',
  instagram: 'bg-pink-500/15 text-pink-400',
  script: 'bg-green-500/15 text-green-400',
}

const CHANNEL_LABELS: Record<string, string> = {
  blog: '블로그',
  threads: 'Threads',
  instagram: '인스타그램',
  script: '영상',
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'accent' | 'success' | 'warning' }> = {
  draft: { label: '초안', variant: 'default' },
  generated: { label: '생성됨', variant: 'accent' },
  published: { label: '발행됨', variant: 'success' },
}

type SortKey = 'created_at' | 'title' | 'seo_score'

export default function ContentsPage() {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChannel, setActiveChannel] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('created_at')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: 'info' | 'success' | 'error' | 'warning' }>({ visible: false, message: '', variant: 'info' })

  const fetchContents = async () => {
    setLoading(true)
    const token = sessionStorage.getItem('token')
    if (!token) return

    const params = new URLSearchParams({ page: String(page), limit: '20', sort, order: 'desc' })
    if (activeChannel !== 'all') params.set('channel', activeChannel)
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/contents?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        setContents(json.data)
        setTotalPages(json.pagination.totalPages)
      }
    } catch {
      setToast({ visible: true, message: '콘텐츠 목록을 불러올 수 없습니다.', variant: 'error' as const })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContents()
  }, [activeChannel, sort, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchContents()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 콘텐츠를 삭제하시겠습니까?')) return

    const token = sessionStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/contents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setContents((prev) => prev.filter((c) => c.id !== id))
        setToast({ visible: true, message: '콘텐츠가 삭제되었습니다.', variant: 'success' as const })
      }
    } catch {
      setToast({ visible: true, message: '삭제에 실패했습니다.', variant: 'error' as const })
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">콘텐츠</h1>
          <p className="text-sm text-text-secondary mt-1">AI로 생성한 콘텐츠를 관리하세요</p>
        </div>
        <a href="/contents/new">
          <Button>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            새 콘텐츠 생성
          </Button>
        </a>
      </div>

      {/* Channel Tabs */}
      <div className="flex border-b border-[rgba(240,246,252,0.1)] gap-1 overflow-x-auto">
        {CHANNEL_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveChannel(tab.id); setPage(1) }}
            className={`
              relative px-4 py-2.5 text-sm font-medium whitespace-nowrap min-h-[44px]
              transition-colors duration-150
              ${activeChannel === tab.id ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}
            `}
          >
            {tab.label}
            {activeChannel === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="콘텐츠 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">검색</Button>
        </form>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-11 px-3 bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg text-sm"
        >
          <option value="created_at">최신순</option>
          <option value="title">제목순</option>
          <option value="seo_score">SEO 점수순</option>
        </select>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : contents.length === 0 ? (
        <EmptyState
          title="콘텐츠가 없습니다"
          description="AI를 활용해 첫 번째 콘텐츠를 생성해보세요"
          action={
            <a href="/contents/new">
              <Button>콘텐츠 생성하기</Button>
            </a>
          }
        />
      ) : (
        <div className="space-y-3">
          {contents.map((content) => (
            <a key={content.id} href={`/contents/${content.id}`}>
              <Card hover className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${CHANNEL_COLORS[content.channel] || ''}`}>
                      {CHANNEL_LABELS[content.channel] || content.channel}
                    </span>
                    <Badge variant={STATUS_MAP[content.status]?.variant || 'default'} size="sm">
                      {STATUS_MAP[content.status]?.label || content.status}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium text-text-primary truncate">
                    {content.title || '제목 없음'}
                  </h3>
                  <p className="text-xs text-text-tertiary mt-1">
                    {content.keyword && <span className="mr-3">키워드: {content.keyword}</span>}
                    {new Date(content.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {content.seo_score !== null && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-accent-primary">{content.seo_score}</div>
                      <div className="text-xs text-text-tertiary">SEO</div>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(content.id) }}
                    className="text-text-tertiary hover:text-accent-error transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="삭제"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            이전
          </Button>
          <span className="flex items-center text-sm text-text-secondary px-3">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </Button>
        </div>
      )}

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  )
}
