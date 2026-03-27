'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { CHANNEL_LABEL_MAP, CHANNEL_COLOR_MAP } from '@/lib/constants'

interface ContentDetail {
  id: string
  keyword_id: string | null
  keyword: string | null
  channel: string
  title: string | null
  body: string | null
  hashtags: string[]
  seo_score: number | null
  status: string
  published_at: string | null
  meta: Record<string, unknown>
  created_at: string
  updated_at: string | null
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'accent' | 'success' }> = {
  draft: { label: '초안', variant: 'default' },
  generated: { label: '생성됨', variant: 'accent' },
  published: { label: '발행됨', variant: 'success' },
}

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [content, setContent] = useState<ContentDetail | null>(null)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const { loading, toast, clearToast, run } = useAsyncAction(true)

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null

  useEffect(() => {
    if (!token || !id) return
    run(async () => {
      const res = await fetch(`/api/contents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d.success) {
        setContent(d.data)
        setEditBody(d.data.body || '')
        setEditTitle(d.data.title || '')
      }
    }, { errorMessage: '콘텐츠를 불러올 수 없습니다.' })
  }, [token, id, run])

  const handleSave = async () => {
    if (!token || !content) return
    setSaving(true)
    await run(async () => {
      const res = await fetch(`/api/contents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      })
      const json = await res.json()
      if (json.success) {
        setContent(json.data)
        setEditing(false)
      }
    }, {
      successMessage: '저장되었습니다.',
      errorMessage: '저장에 실패했습니다.',
    })
    setSaving(false)
  }

  const handleCopy = () => {
    if (!content?.body) return
    navigator.clipboard.writeText(content.body)
    run(async () => {}, { successMessage: '클립보드에 복사되었습니다.' })

    if (token && content.id) {
      fetch('/api/publish/clipboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content_id: content.id }),
      }).catch(() => {})
    }
  }

  const handleDuplicate = async () => {
    if (!token || !content) return
    await run(async () => {
      const res = await fetch(`/api/contents/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        router.push(`/contents/${json.data.id}`)
      }
    }, {
      successMessage: '복제되었습니다.',
      errorMessage: '복제에 실패했습니다.',
    })
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-4">
        <div className="h-8 w-64 bg-bg-tertiary rounded-lg animate-pulse" />
        <div className="h-96 bg-bg-tertiary rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="p-4 lg:p-8">
        <Card>
          <p className="text-text-secondary text-center py-8">콘텐츠를 찾을 수 없습니다.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <a href="/contents" className="text-sm text-text-tertiary hover:text-text-secondary mb-2 inline-block">
              ← 콘텐츠 목록
            </a>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${CHANNEL_COLOR_MAP[content.channel] || ''}`}>
                {CHANNEL_LABEL_MAP[content.channel] || content.channel}
              </span>
              <Badge variant={STATUS_MAP[content.status]?.variant || 'default'}>
                {STATUS_MAP[content.status]?.label || content.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-text-primary">{content.title || '제목 없음'}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopy}>복사</Button>
            <Button variant="secondary" size="sm" onClick={handleDuplicate}>복제</Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? '취소' : '편집'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Card>
              {editing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full h-11 px-4 text-base bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg"
                    placeholder="제목"
                  />
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full min-h-[400px] px-4 py-3 text-sm bg-bg-tertiary text-text-primary border border-[rgba(240,246,252,0.1)] rounded-lg resize-y font-mono"
                    placeholder="콘텐츠 본문"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>취소</Button>
                    <Button size="sm" onClick={handleSave} loading={saving}>저장</Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div
                    className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{
                      __html: (content.body || '내용이 없습니다.')
                        .replace(/^### (.+)/gm, '<h3>$1</h3>')
                        .replace(/^## (.+)/gm, '<h2>$1</h2>')
                        .replace(/^# (.+)/gm, '<h1>$1</h1>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    }}
                  />
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            {/* SEO Score */}
            {content.seo_score !== null && (
              <Card>
                <h3 className="text-sm font-medium text-text-secondary mb-3">SEO 점수</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(240,246,252,0.1)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="var(--color-accent-primary)"
                        strokeWidth="8"
                        strokeDasharray={`${(content.seo_score / 100) * 264} 264`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-text-primary">{content.seo_score}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Info */}
            <Card>
              <h3 className="text-sm font-medium text-text-secondary mb-3">정보</h3>
              <dl className="space-y-2 text-sm">
                {content.keyword && (
                  <div className="flex justify-between">
                    <dt className="text-text-tertiary">키워드</dt>
                    <dd className="text-text-primary">{content.keyword}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">글자 수</dt>
                  <dd className="text-text-primary">{content.body?.length || 0}자</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-tertiary">생성일</dt>
                  <dd className="text-text-primary">{new Date(content.created_at).toLocaleDateString('ko-KR')}</dd>
                </div>
                {content.published_at && (
                  <div className="flex justify-between">
                    <dt className="text-text-tertiary">발행일</dt>
                    <dd className="text-text-primary">{new Date(content.published_at).toLocaleDateString('ko-KR')}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Hashtags */}
            {content.hashtags?.length > 0 && (
              <Card>
                <h3 className="text-sm font-medium text-text-secondary mb-3">해시태그</h3>
                <div className="flex flex-wrap gap-1.5">
                  {content.hashtags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-secondary rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Publish Actions */}
            {content.status !== 'published' && (
              <Card>
                <h3 className="text-sm font-medium text-text-secondary mb-3">발행</h3>
                <div className="space-y-2">
                  {content.channel === 'blog' && (
                    <Button fullWidth variant="secondary" size="sm" onClick={handleCopy}>
                      네이버 블로그에 복사
                    </Button>
                  )}
                  {content.channel === 'instagram' && (
                    <Button fullWidth size="sm" onClick={() => {
                      run(async () => {}, { successMessage: 'Instagram 발행을 위해 이미지가 필요합니다.' })
                    }}>
                      Instagram 발행
                    </Button>
                  )}
                  {content.channel === 'threads' && (
                    <Button fullWidth size="sm" onClick={async () => {
                      if (!token) return
                      await run(async () => {
                        const res = await fetch('/api/publish/threads', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ content_id: content.id }),
                        })
                        const json = await res.json()
                        if (json.success) {
                          setContent({ ...content, status: 'published', published_at: json.data.published_at })
                        } else {
                          throw new Error(json.error || '발행 실패')
                        }
                      }, {
                        successMessage: 'Threads에 발행되었습니다.',
                        errorMessage: '발행 중 오류가 발생했습니다.',
                      })
                    }}>
                      Threads 발행
                    </Button>
                  )}
                  <a href="/calendar" className="block">
                    <Button fullWidth variant="ghost" size="sm">예약 발행</Button>
                  </a>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}
