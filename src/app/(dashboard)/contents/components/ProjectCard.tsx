'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { CHANNEL_LABEL_MAP, CHANNEL_COLOR_MAP } from '@/lib/constants'

const CHANNEL_LIST = ['blog', 'instagram', 'threads', 'facebook'] as const

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
  created_at: string
  updated_at: string
  contents?: ProjectContent[]
  image_channels?: string[]
  has_video?: boolean
  keywords?: { keyword: string; grade: string }
  settings_snapshot?: { selected_channels?: string[]; [key: string]: unknown }
}

interface ProjectCardProps {
  proj: ProjectItem
  isExpanded: boolean
  onToggleExpand: () => void
  editingMemo: boolean
  memoDate: string
  onEditMemo: () => void
  onMemoDateChange: (date: string) => void
  onSaveMemo: (contentIds: string[]) => void
  onCancelMemo: () => void
}

function getChannelStatus(contents: ProjectContent[], imageChannels: string[] = []) {
  return CHANNEL_LIST.map((ch) => {
    const content = contents.find((c) => c.channel === ch)
    return { channel: ch, hasText: !!content, hasImage: imageChannels.includes(ch), content }
  })
}

function getScheduledDate(contents: ProjectContent[]): string | null {
  for (const c of contents) {
    const sc = (c as unknown as { scheduled_date?: string }).scheduled_date
    if (sc) return sc
  }
  return null
}

export default function ProjectCard({
  proj, isExpanded, onToggleExpand,
  editingMemo, memoDate, onEditMemo, onMemoDateChange, onSaveMemo, onCancelMemo,
}: ProjectCardProps) {
  const contents = proj.contents || []
  const channelStatuses = getChannelStatus(contents, proj.image_channels || [])
  const scheduledDate = getScheduledDate(contents)
  const keywordName = proj.keywords?.keyword || proj.keyword_text || '키워드 없음'
  const projSelectedChannels = proj.settings_snapshot?.selected_channels || []
  const hasBlog = proj.contents?.some((c) => c.channel === 'blog')
  const isPendingDelete =
    projSelectedChannels.includes('blog') &&
    !hasBlog &&
    new Date(proj.updated_at).getTime() < (Date.now() - 7 * 24 * 60 * 60 * 1000)

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">{keywordName}</h3>
            <Badge variant={proj.business_type === 'B2B' ? 'accent' : 'success'}>{proj.business_type}</Badge>
            {proj.status === 'completed' && <Badge variant="success">완료</Badge>}
            {isPendingDelete && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-warning/10 text-accent-warning font-medium">D-7 삭제 예정</span>
            )}
          </div>
          <p className="text-xs text-text-tertiary mt-1">{new Date(proj.created_at).toLocaleDateString('ko-KR')} 생성</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
            {channelStatuses.map((cs) => {
              const isSelected = projSelectedChannels.includes(cs.channel)
              const isComplete = cs.hasText && cs.hasImage
              const linkHref = cs.hasText
                ? `/contents/${cs.content?.id}`
                : (proj.current_step >= 5 ? `/create/channel-write?project_id=${proj.id}` : null)

              return (
                <div key={cs.channel} className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] ${
                  !isSelected ? 'bg-surface-secondary/50 text-text-tertiary opacity-50'
                  : isComplete ? 'bg-green-400/10 text-green-400'
                  : cs.hasText ? 'bg-accent-primary/10 text-accent-primary'
                  : 'bg-surface-secondary text-text-tertiary'
                }`}>
                  {linkHref ? (
                    <Link href={linkHref} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                      {CHANNEL_LABEL_MAP[cs.channel] || cs.channel}
                    </Link>
                  ) : (
                    <span className="font-medium">{CHANNEL_LABEL_MAP[cs.channel] || cs.channel}</span>
                  )}
                  <span>{isComplete ? '✓' : cs.hasText ? '글' : '—'}</span>
                </div>
              )
            })}
            <div className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] ${
              proj.has_video ? 'bg-green-400/10 text-green-400' : 'bg-surface-secondary text-text-tertiary'
            }`}>
              <Link href={`/create/video-script?project_id=${proj.id}`}
                className="font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >{CHANNEL_LABEL_MAP['video_script'] || '영상'}</Link>
              <span>{proj.has_video ? '✓' : '—'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {editingMemo ? (
              <div className="flex items-center gap-2">
                <input type="date" value={memoDate} onChange={(e) => onMemoDateChange(e.target.value)}
                  className="py-1 px-2 rounded bg-surface-secondary border border-border-primary text-text-primary text-xs" />
                <Button size="sm" variant="secondary" onClick={() => onSaveMemo(contents.map((c) => c.id))}>저장</Button>
                <button onClick={onCancelMemo} className="text-xs text-text-tertiary hover:text-text-secondary">취소</button>
              </div>
            ) : (
              <button onClick={onEditMemo} className="text-xs text-text-tertiary hover:text-accent-primary transition-colors flex items-center gap-1">
                <span>📅</span>
                {scheduledDate ? <span>발행 메모: {scheduledDate}</span> : <span>발행 메모 추가</span>}
              </button>
            )}
          </div>
        </div>

        <button onClick={onToggleExpand} className="text-xs text-accent-primary hover:underline min-h-[44px] flex items-center shrink-0">
          {isExpanded ? '접기' : '전체 보기'}
        </button>
      </div>

      {isExpanded && contents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[rgba(240,246,252,0.08)] space-y-2">
          {contents.map((c) => (
            <Link key={c.id} href={`/contents/${c.id}`}>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary hover:bg-[rgba(240,246,252,0.06)] transition-colors cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${CHANNEL_COLOR_MAP[c.channel] || ''}`}>
                    {CHANNEL_LABEL_MAP[c.channel] || c.channel}
                  </span>
                  <span className="text-sm text-text-primary truncate">{c.title || '제목 없음'}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.seo_score != null && <span className="text-xs font-semibold text-accent-primary">SEO {c.seo_score}</span>}
                  <Badge variant={c.confirmed_at ? 'success' : c.status === 'generated' ? 'default' : 'warning'} size="sm">
                    {c.confirmed_at ? '확정' : c.status === 'generated' ? '생성됨' : c.status}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
          {proj.has_video && (
            <Link href={`/create/video-script?project_id=${proj.id}`}>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary hover:bg-[rgba(240,246,252,0.06)] transition-colors cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${CHANNEL_COLOR_MAP['video_script'] || ''}`}>
                    {CHANNEL_LABEL_MAP['video_script'] || '영상'}
                  </span>
                  <span className="text-sm text-text-primary">영상 스크립트</span>
                </div>
                <Badge variant="success" size="sm">생성됨</Badge>
              </div>
            </Link>
          )}
        </div>
      )}

      {isExpanded && contents.length === 0 && (
        <div className="mt-4 pt-4 border-t border-[rgba(240,246,252,0.08)]">
          <p className="text-xs text-text-tertiary text-center py-2">아직 생성된 콘텐츠가 없습니다.</p>
          <div className="flex justify-center mt-2">
            <Link href={`/create/channel-write?project_id=${proj.id}`}>
              <Button size="sm">콘텐츠 생성하기</Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}
