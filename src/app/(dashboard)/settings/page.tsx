'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Toast from '@/components/ui/Toast'
import Card from '@/components/ui/Card'

// 탭 스켈레톤 로딩 컴포넌트
function TabSkeleton() {
  return (
    <div className="space-y-6">
      <Card><div className="space-y-4"><div className="h-5 bg-bg-tertiary rounded w-1/4 animate-pulse" /><div className="h-10 bg-bg-tertiary rounded animate-pulse" /><div className="h-10 bg-bg-tertiary rounded animate-pulse" /></div></Card>
      <Card><div className="space-y-4"><div className="h-5 bg-bg-tertiary rounded w-1/3 animate-pulse" /><div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-bg-tertiary rounded animate-pulse" />)}</div></div></Card>
    </div>
  )
}

// Dynamic imports — 각 탭을 lazy loading
const BusinessProfileTab = dynamic(() => import('@/components/settings/BusinessProfileTab'), { loading: () => <TabSkeleton /> })
const ProfileTab = dynamic(() => import('@/components/settings/ProfileTab'), { loading: () => <TabSkeleton /> })
const PlanTab = dynamic(() => import('@/components/settings/PlanTab'), { loading: () => <TabSkeleton /> })
const KeywordSettingsTab = dynamic(() => import('@/components/settings/KeywordSettingsTab'), { loading: () => <TabSkeleton /> })
const PromptsTab = dynamic(() => import('@/components/settings/PromptsTab'), { loading: () => <TabSkeleton /> })
const BrandVoiceTab = dynamic(() => import('@/components/settings/BrandVoiceTab'), { loading: () => <TabSkeleton /> })
const SnsTab = dynamic(() => import('@/components/settings/SnsTab'), { loading: () => <TabSkeleton /> })
const NotificationsTab = dynamic(() => import('@/components/settings/NotificationsTab'), { loading: () => <TabSkeleton /> })

const TABS = [
  { id: 'business', label: '마이페이지' },
  { id: 'profile', label: '프로필' },
  { id: 'plan', label: '플랜' },
  { id: 'keyword-settings', label: '키워드 설정' },
  { id: 'prompts', label: '채널 프롬프트' },
  { id: 'brand-voice', label: 'Brand Voice' },
  { id: 'sns', label: 'SNS 연동' },
  { id: 'notifications', label: '알림' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      return TABS.some((t) => t.id === hash) ? hash : 'business'
    }
    return 'business'
  })
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tabId}`)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">설정</h1>

      {/* Tabs */}
      <div role="tablist" aria-orientation="horizontal" className="flex border-b border-[rgba(240,246,252,0.1)] gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabChange(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'business' && <BusinessProfileTab onToast={setToast} />}
        {activeTab === 'profile' && <ProfileTab onToast={setToast} />}
        {activeTab === 'plan' && <PlanTab />}
        {activeTab === 'keyword-settings' && <KeywordSettingsTab onToast={setToast} />}
        {activeTab === 'prompts' && <PromptsTab onToast={setToast} />}
        {activeTab === 'brand-voice' && <BrandVoiceTab onToast={setToast} />}
        {activeTab === 'sns' && <SnsTab onToast={setToast} />}
        {activeTab === 'notifications' && <NotificationsTab onToast={setToast} />}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          visible
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
