'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Badge from '@/components/ui/Badge'

interface NavItem {
  icon: string
  label: string
  href: string
}

const adminNavItems: NavItem[] = [
  { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4', label: 'KPI 대시보드', href: '/admin' },
  { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', label: '회원 관리', href: '/admin/users' },
  { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: '프롬프트', href: '/admin/prompts' },
  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: '메일 발송', href: '/admin/mail' },
  { icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z', label: '플랜 설정', href: '/admin/plans' },
  { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: '고객 지원', href: '/admin/support' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const userData = sessionStorage.getItem('user')
    if (!token || !userData) {
      router.push('/login')
      return
    }
    try {
      const parsed = JSON.parse(userData)
      if (!['admin', 'super_admin'].includes(parsed.role)) {
        router.push('/dashboard')
        return
      }
      setUser(parsed)
    } catch {
      router.push('/login')
    }
  }, [router])

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[240px] bg-bg-secondary border-r border-[rgba(240,246,252,0.1)] flex flex-col
          transform transition-transform duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-[rgba(240,246,252,0.1)]">
          <div className="w-8 h-8 rounded-lg bg-accent-error flex items-center justify-center">
            <span className="text-white font-bold text-sm">AD</span>
          </div>
          <span className="text-base font-semibold text-text-primary">관리자</span>
          <Badge variant="error" size="sm">Admin</Badge>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px]
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-accent-error/10 text-accent-error'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* Back to Dashboard */}
        <div className="px-3 pb-4">
          <a
            href="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            대시보드로 돌아가기
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-[rgba(240,246,252,0.1)] sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-xl">
          <button
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-text-secondary">{user.name}</span>
            <Badge variant="error" size="sm">{user.role}</Badge>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
