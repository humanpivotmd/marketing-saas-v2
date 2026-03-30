'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import { BusinessProfileProvider } from '@/hooks/useBusinessProfile'
import { authHeaders } from '@/lib/auth-client'

interface NavItem {
  icon: string
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4', label: '대시보드', href: '/dashboard' },
  { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: '키워드', href: '/keywords' },
  { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: '콘텐츠', href: '/contents' },
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: '캘린더', href: '/calendar' },
  { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: '설정', href: '/settings' },
]

const adminNavItems: NavItem[] = [
  { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', label: '관리자', href: '/admin' },
]

interface UserData {
  id: string
  name: string
  email: string
  role: string
  plan: string
  onboarding_done: boolean
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [usagePercent, setUsagePercent] = useState(0)
  const [usageText, setUsageText] = useState('')

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const userData = sessionStorage.getItem('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    try {
      const parsed = JSON.parse(userData)
      setUser(parsed)
    } catch {
      router.push('/login')
      return
    }

    // business-profile은 BusinessProfileProvider에서 관리
  }, [router, pathname])

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    if (!token) return
    fetch('/api/mypage/usage', {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const { content } = data.data
          const pct = content.limit > 0 ? Math.round((content.used / content.limit) * 100) : 0
          setUsagePercent(Math.min(pct, 100))
          setUsageText(`${content.used}/${content.limit}`)
        }
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    router.push('/login')
  }

  // Close sidebar on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Skip navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-lg focus:text-sm"
      >
        본문으로 건너뛰기
      </a>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[240px] bg-bg-secondary border-r border-[rgba(240,246,252,0.1)] flex flex-col shrink-0
          transform transition-transform duration-300
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="사이드바 네비게이션"
      >
        {/* Logo */}
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-[rgba(240,246,252,0.1)]">
          <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-base font-semibold text-text-primary">MarketingFlow</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="메인 메뉴">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px]
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-accent-primary
                  ${isActive
                    ? 'bg-bg-tertiary text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* Usage Bar + Profile */}
        <div className="px-3 pb-4 space-y-3">
          <div className="px-3 py-3 bg-bg-tertiary/50 rounded-lg">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-text-tertiary">콘텐츠 사용량</span>
              <span className="text-xs text-text-secondary">{usageText}</span>
            </div>
            <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-primary rounded-full transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
              <span className="text-xs font-medium text-text-secondary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
              <p className="text-xs text-text-tertiary capitalize">{user.plan} Plan</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-accent-danger hover:bg-accent-danger/10 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto overflow-x-hidden max-w-full" id="main-content">
        {/* Topbar */}
        <header className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
              onClick={() => setSidebarOpen(true)}
              aria-label="메뉴 열기"
              aria-expanded={sidebarOpen}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
              aria-label="알림"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-tertiary/50">
              <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium text-accent-primary">{user.name.charAt(0)}</span>
              </div>
              <span className="text-sm text-text-primary">{user.name}</span>
              <Badge variant="accent" size="sm">{user.plan}</Badge>
            </div>
          </div>
        </header>

        <div className="px-4 lg:px-8 pt-6 pb-8">
          <BusinessProfileProvider>
            {children}
          </BusinessProfileProvider>
        </div>
      </main>
    </div>
  )
}
