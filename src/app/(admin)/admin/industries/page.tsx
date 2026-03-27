'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { authHeaders } from '@/lib/auth-client'
import { useAsyncAction } from '@/hooks/useAsyncAction'

interface Industry {
  id: string
  parent_id: string | null
  name: string
  level: number
  sort_order: number
  is_active: boolean
  children?: Industry[]
}

export default function AdminIndustriesPage() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const { loading, toast, clearToast, run } = useAsyncAction(true)

  // 모달 상태
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Industry | null>(null)
  const [formName, setFormName] = useState('')
  const [formParentId, setFormParentId] = useState<string>('')
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(() => {
    run(async () => {
      const res = await fetch('/api/admin/industries?active=false', { headers: authHeaders() })
      const json = await res.json()
      if (json.success) setIndustries(json.data)
    }, { errorMessage: '업종 목록 로드 실패' })
  }, [run])

  useEffect(() => { fetchData() }, [fetchData])

  const openAddModal = (parentId?: string) => {
    setEditItem(null)
    setFormName('')
    setFormParentId(parentId || '')
    setFormSortOrder(0)
    setFormActive(true)
    setShowModal(true)
  }

  const openEditModal = (item: Industry) => {
    setEditItem(item)
    setFormName(item.name)
    setFormParentId(item.parent_id || '')
    setFormSortOrder(item.sort_order)
    setFormActive(item.is_active)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)
    const url = editItem
      ? `/api/admin/industries/${editItem.id}`
      : '/api/admin/industries'
    const method = editItem ? 'PUT' : 'POST'
    const body: Record<string, unknown> = {
      name: formName.trim(),
      sort_order: formSortOrder,
      is_active: formActive,
    }
    if (formParentId) body.parent_id = formParentId
    if (!editItem && !formParentId) body.level = 1
    if (!editItem && formParentId) body.level = 2

    await run(async () => {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setShowModal(false)
      fetchData()
    }, {
      successMessage: editItem ? '수정 완료' : '추가 완료',
      errorMessage: '저장 실패',
    })
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 업종을 삭제하시겠습니까? 하위 업종도 함께 삭제됩니다.`)) return
    await run(async () => {
      const res = await fetch(`/api/admin/industries/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      fetchData()
    }, {
      successMessage: '삭제 완료',
      errorMessage: '삭제 실패',
    })
  }

  const renderTree = (items: Industry[], depth = 0) => {
    return items.map(item => (
      <div key={item.id}>
        <div
          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--surface2)] transition-colors"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {depth > 0 && <span className="text-[var(--text-muted)] text-xs">└</span>}
            <span className="text-sm font-medium text-[var(--text)]">{item.name}</span>
            {!item.is_active && <Badge variant="default">비활성</Badge>}
            <span className="text-xs text-[var(--text-muted)]">순서: {item.sort_order}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {item.level < 3 && (
              <Button size="sm" variant="ghost" onClick={() => openAddModal(item.id)}>
                + 하위
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => openEditModal(item)}>
              수정
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id, item.name)}>
              삭제
            </Button>
          </div>
        </div>
        {item.children && item.children.length > 0 && renderTree(item.children, depth + 1)}
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text)]">업종 관리</h1>
        <Button onClick={() => openAddModal()}>+ 대분류 추가</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">로딩 중...</div>
        ) : industries.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">등록된 업종이 없습니다.</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {renderTree(industries)}
          </div>
        )}
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? '업종 수정' : '업종 추가'}>
          <div className="space-y-4">
            <Input
              label="업종명"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="업종명 입력"
            />
            <Input
              label="정렬 순서"
              type="number"
              value={String(formSortOrder)}
              onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
            />
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
              />
              활성화
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowModal(false)}>취소</Button>
              <Button onClick={handleSave} disabled={saving || !formName.trim()}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
      </Modal>

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={clearToast} />}
    </div>
  )
}
