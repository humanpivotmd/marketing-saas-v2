import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다 - MarketingFlow',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <p className="text-7xl font-bold text-accent-primary mb-2">404</p>
          <div className="w-16 h-1 bg-accent-primary/30 rounded-full mx-auto" />
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-3">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-text-secondary mb-8">
          요청하신 페이지가 존재하지 않거나, 이동되었을 수 있습니다.
          <br />
          URL을 다시 확인해 주세요.
        </p>

        <div className="flex items-center justify-center gap-3">
          <a
            href="/"
            className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium text-white bg-accent-primary hover:bg-accent-primary-hover rounded-lg shadow-glow-blue transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary"
          >
            홈으로 돌아가기
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium text-text-secondary border border-[rgba(240,246,252,0.1)] hover:text-text-primary hover:border-[rgba(240,246,252,0.2)] hover:bg-bg-tertiary rounded-lg transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary"
          >
            대시보드
          </a>
        </div>
      </div>
    </div>
  )
}
