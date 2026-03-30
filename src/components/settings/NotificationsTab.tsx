'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'

export default function NotificationsTab({ onToast }: { onToast: (t: { message: string; variant: 'success' | 'error' }) => void }) {
  const [settings, setSettings] = useState({
    marketing: true,
    weekly_report: true,
    content_published: true,
    usage_warning: true,
  })

  const handleToggle = (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key as keyof typeof settings] }
    setSettings(newSettings)
    onToast({ message: '알림 설정이 변경되었습니다.', variant: 'success' })
  }

  const items = [
    { key: 'marketing', label: '마케팅 이메일', description: '프로모션, 새 기능 안내 등' },
    { key: 'weekly_report', label: '주간 리포트', description: '매주 월요일 콘텐츠 성과 리포트' },
    { key: 'content_published', label: '콘텐츠 발행 알림', description: '예약된 콘텐츠가 발행될 때' },
    { key: 'usage_warning', label: '사용량 경고', description: '사용량 한도 80% 도달 시 알림' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text-primary">이메일 알림 설정</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.key} padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{item.description}</p>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings[item.key as keyof typeof settings] ? 'bg-accent-primary' : 'bg-bg-tertiary'
                }`}
                role="switch"
                aria-checked={settings[item.key as keyof typeof settings]}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    settings[item.key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
