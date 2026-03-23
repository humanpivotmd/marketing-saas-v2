'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

const sidebarItems = [
  { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4', label: 'Dashboard', active: true },
  { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Keywords' },
  { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Content' },
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Calendar' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics' },
];

const recentContents = [
  { title: '2026 Home Cafe Trend Guide', type: 'Blog', seo: 92, status: 'Published', date: '2h ago' },
  { title: 'Spring Interior Color Tips', type: 'Blog', seo: 87, status: 'Published', date: '1d ago' },
  { title: 'Best Noise-Cancelling Headphones', type: 'Threads', seo: 78, status: 'Draft', date: '2d ago' },
  { title: 'Morning Routine for Productivity', type: 'Instagram', seo: 84, status: 'Scheduled', date: '3d ago' },
];

const topKeywords = [
  { keyword: 'home cafe recipe', volume: 12400, grade: 'A+', trend: 'up' },
  { keyword: 'spring interior', volume: 8900, grade: 'A', trend: 'up' },
  { keyword: 'noise cancelling', volume: 6200, grade: 'B+', trend: 'stable' },
  { keyword: 'morning routine', volume: 4800, grade: 'B', trend: 'down' },
];

export default function DashboardPreviewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[240px] bg-bg-secondary border-r border-[rgba(240,246,252,0.1)] flex flex-col shrink-0
        transform transition-transform duration-[var(--transition-slow)]
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-[rgba(240,246,252,0.1)]">
          <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-base font-semibold text-text-primary">MarketingFlow</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-[var(--transition-fast)]
                ${item.active
                  ? 'bg-bg-tertiary text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                }
              `}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-3">
          <div className="px-3 py-3 bg-bg-tertiary/50 rounded-lg">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-text-tertiary">Contents used</span>
              <span className="text-xs text-text-secondary">43/100</span>
            </div>
            <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
              <div className="h-full w-[43%] bg-accent-primary rounded-full" />
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
              <span className="text-xs font-medium text-text-secondary">K</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">Kim Minji</p>
              <p className="text-xs text-text-tertiary">Starter Plan</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Topbar */}
        <header className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-[rgba(240,246,252,0.1)]">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-text-primary">Dashboard</h1>
          </div>
          <Button size="sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 4v8M4 8h8" />
            </svg>
            New Content
          </Button>
        </header>

        <div className="p-4 lg:p-8 max-w-6xl">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { label: 'Total Contents', value: '43', change: '+12', changeType: 'up' },
              { label: 'Published', value: '28', change: '+5', changeType: 'up' },
              { label: 'Avg SEO Score', value: '84.5', change: '+2.3', changeType: 'up' },
              { label: 'Total Views', value: '12.4K', change: '-3%', changeType: 'down' },
            ].map((stat) => (
              <Card key={stat.label} padding="md">
                <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  <span className={`text-xs font-medium ${stat.changeType === 'up' ? 'text-accent-success' : 'text-accent-error'}`}>
                    {stat.change}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Contents */}
            <div className="lg:col-span-2">
              <Card padding="sm">
                <div className="px-4 py-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-text-primary">Recent Contents</h2>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <div className="divide-y divide-[rgba(240,246,252,0.06)]">
                  {recentContents.map((content) => (
                    <div key={content.title} className="px-4 py-3.5 flex items-center gap-4 hover:bg-bg-tertiary/30 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{content.title}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">{content.type} &middot; {content.date}</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`text-sm font-semibold ${content.seo >= 85 ? 'text-accent-success' : content.seo >= 70 ? 'text-accent-warning' : 'text-text-secondary'}`}>
                          {content.seo}
                        </span>
                        <Badge
                          variant={content.status === 'Published' ? 'success' : content.status === 'Draft' ? 'default' : 'accent'}
                          size="sm"
                        >
                          {content.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Top Keywords */}
            <div>
              <Card padding="sm">
                <div className="px-4 py-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-text-primary">Top Keywords</h2>
                  <Button variant="ghost" size="sm">Analyze</Button>
                </div>
                <div className="divide-y divide-[rgba(240,246,252,0.06)]">
                  {topKeywords.map((kw) => (
                    <div key={kw.keyword} className="px-4 py-3 flex items-center justify-between hover:bg-bg-tertiary/30 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm text-text-primary">{kw.keyword}</p>
                        <p className="text-xs text-text-tertiary">{kw.volume.toLocaleString()} searches/mo</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={kw.grade.startsWith('A') ? 'success' : kw.grade.startsWith('B') ? 'accent' : 'default'}
                          size="sm"
                        >
                          {kw.grade}
                        </Badge>
                        <span className={`text-xs ${kw.trend === 'up' ? 'text-accent-success' : kw.trend === 'down' ? 'text-accent-error' : 'text-text-tertiary'}`}>
                          {kw.trend === 'up' ? '\u2191' : kw.trend === 'down' ? '\u2193' : '\u2192'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-6">
                <h2 className="text-base font-semibold text-text-primary mb-4">Quick Actions</h2>
                <div className="space-y-2.5">
                  <Button variant="secondary" fullWidth size="sm">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 5v3l2 1" />
                    </svg>
                    One-Click Generate
                  </Button>
                  <Button variant="secondary" fullWidth size="sm">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M4 8h8M8 4v8" />
                    </svg>
                    Add Keywords
                  </Button>
                </div>
              </Card>

              {/* Loading Preview */}
              <Card className="mt-6">
                <h2 className="text-base font-semibold text-text-primary mb-4">Loading State</h2>
                <div className="space-y-3">
                  <Skeleton variant="title" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="80%" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
