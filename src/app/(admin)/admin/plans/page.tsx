'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'

interface Plan {
  id: string
  name: string
  display_name: string
  price_monthly: number
  price_yearly: number
  content_limit: number
  keyword_limit: number
  image_limit: number
  saved_keyword_limit: number
  channel_limit: number
  brand_voice_limit: number
  is_active: boolean
  sort_order: number
}

function getToken() { return sessionStorage.getItem('token') || '' }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } }

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const fetchPlans = () => {
    setLoading(true)
    fetch('/api/admin/plan-limits', { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => { if (res.success) setPlans(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPlans() }, [])

  const handleSave = async () => {
    if (!editPlan) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/plan-limits', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(editPlan),
      })
      const data = await res.json()
      if (data.success) {
        setToast({ message: '플랜이 수정되었습니다.', variant: 'success' })
        fetchPlans()
        setEditPlan(null)
      } else {
        setToast({ message: data.error || '오류가 발생했습니다.', variant: 'error' })
      }
    } catch {
      setToast({ message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    }
    setSaving(false)
  }

  const limitFields = [
    { key: 'content_limit', label: '콘텐츠/월' },
    { key: 'keyword_limit', label: '키워드 분석/월' },
    { key: 'image_limit', label: '이미지 생성/월' },
    { key: 'saved_keyword_limit', label: '저장 키워드' },
    { key: 'channel_limit', label: '채널 연동' },
    { key: 'brand_voice_limit', label: 'Brand Voice' },
  ] as const

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">플랜 설정</h1>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Card key={i}><div className="h-40 animate-pulse bg-bg-tertiary rounded" /></Card>)}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{plan.display_name}</h3>
                  <p className="text-sm text-text-tertiary">{plan.name}</p>
                </div>
                <div className="text-right">
                  <Badge variant={plan.is_active ? 'success' : 'default'} size="sm">
                    {plan.is_active ? '활성' : '비활성'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div className="text-text-secondary">월 가격: <span className="text-text-primary font-medium">{plan.price_monthly.toLocaleString()}원</span></div>
                <div className="text-text-secondary">연 가격: <span className="text-text-primary font-medium">{plan.price_yearly.toLocaleString()}원</span></div>
              </div>

              <div className="space-y-1.5 text-sm">
                {limitFields.map((f) => (
                  <div key={f.key} className="flex justify-between">
                    <span className="text-text-tertiary">{f.label}</span>
                    <span className="text-text-primary font-medium">
                      {plan[f.key] === 0 ? '무제한' : plan[f.key]}
                    </span>
                  </div>
                ))}
              </div>

              <Button variant="secondary" size="sm" className="mt-4" fullWidth onClick={() => setEditPlan({ ...plan })}>
                수정
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditPlan(null)} />
          <div className="relative w-full max-w-lg bg-bg-elevated rounded-2xl border border-[rgba(240,246,252,0.1)] shadow-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">{editPlan.display_name} 수정</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input label="표시 이름" value={editPlan.display_name} onChange={(e) => setEditPlan({ ...editPlan, display_name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="월 가격 (원)" type="number" value={String(editPlan.price_monthly)} onChange={(e) => setEditPlan({ ...editPlan, price_monthly: parseInt(e.target.value) || 0 })} />
                <Input label="연 가격 (원)" type="number" value={String(editPlan.price_yearly)} onChange={(e) => setEditPlan({ ...editPlan, price_yearly: parseInt(e.target.value) || 0 })} />
              </div>
              {limitFields.map((f) => (
                <Input
                  key={f.key}
                  label={`${f.label} (0 = 무제한)`}
                  type="number"
                  value={String(editPlan[f.key])}
                  onChange={(e) => setEditPlan({ ...editPlan, [f.key]: parseInt(e.target.value) || 0 })}
                />
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setEditPlan(null)}>취소</Button>
              <Button onClick={handleSave} loading={saving}>저장</Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} visible onClose={() => setToast(null)} />}
    </div>
  )
}
