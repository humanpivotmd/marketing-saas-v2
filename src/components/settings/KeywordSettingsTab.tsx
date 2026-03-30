'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { NAVER_BLOG_TOPICS } from '@/lib/constants'
import { authHeaders } from '@/lib/auth-client'

export default function KeywordSettingsTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [keywords, setKeywords] = useState<{ id: string; keyword: string; group_name: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyword, setNewKeyword] = useState('')
  const [newTopic, setNewTopic] = useState('')

  const fetchKeywords = useCallback(() => {
    setLoading(true)
    fetch('/api/keywords', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setKeywords(res.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchKeywords() }, [fetchKeywords])

  const handleAdd = async () => {
    if (!newKeyword.trim()) return
    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ keyword: newKeyword.trim(), group_name: newTopic || null }),
      })
      const data = await res.json()
      if (data.success) {
        onToast({ message: '키워드가 등록되었습니다.', variant: 'success' })
        setNewKeyword('')
        setNewTopic('')
        fetchKeywords()
      } else {
        onToast({ message: data.error || '등록 실패', variant: 'error' })
      }
    } catch {
      onToast({ message: '등록 중 오류가 발생했습니다.', variant: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/keywords', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [id] }),
      })
      onToast({ message: '삭제되었습니다.', variant: 'success' })
      fetchKeywords()
    } catch {
      onToast({ message: '삭제 실패', variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">고정 키워드 관리</h2>
        <p className="text-sm text-text-secondary mt-1">콘텐츠 생성 시 자주 사용하는 키워드를 등록하세요.</p>
      </div>

      {/* 키워드 추가 */}
      <Card>
        <div className="space-y-3">
          <Input
            label="키워드"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="예: 소상공인 마케팅"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">네이버 블로그 주제</label>
            <select
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-tertiary border border-[rgba(240,246,252,0.1)] text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="">주제 선택 (선택사항)</option>
              {NAVER_BLOG_TOPICS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.topics.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <Button onClick={handleAdd} disabled={!newKeyword.trim()}>키워드 등록</Button>
        </div>
      </Card>

      {/* 등록된 키워드 목록 */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          등록된 키워드 <span className="text-text-tertiary font-normal">({keywords.length})</span>
        </h3>
        {loading ? (
          <p className="text-sm text-text-tertiary">불러오는 중...</p>
        ) : keywords.length === 0 ? (
          <EmptyState title="등록된 키워드가 없습니다" description="위에서 키워드를 등록하세요." />
        ) : (
          <div className="space-y-2">
            {keywords.map((kw) => (
              <Card key={kw.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-text-primary">{kw.keyword}</span>
                    {kw.group_name && (
                      <Badge className="ml-2">{kw.group_name}</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(kw.id)}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
