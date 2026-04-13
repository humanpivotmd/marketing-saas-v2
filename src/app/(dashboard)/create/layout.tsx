'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

const STEPS = [
  { label: '키워드', path: '/keywords' },
  { label: '초안 정보', path: '/create/draft-info' },
  { label: '초안 작성', path: '/create/generating' },
  { label: '채널별 글 + 이미지', path: '/create/channel-write' },
]

export default function CreateLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const currentIdx = STEPS.findIndex(s => pathname.startsWith(s.path))

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={step.label} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                isCurrent
                  ? 'bg-accent-primary/10 text-accent-primary border-accent-primary'
                  : isCompleted
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : 'bg-surface-secondary text-text-tertiary border-border-primary'
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent
                    ? 'bg-accent-primary text-white'
                    : isCompleted
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-border-primary text-text-tertiary'
                }`}>
                  {isCompleted ? '✓' : i + 1}
                </span>
                {step.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-px mx-0.5 shrink-0 ${
                  isCompleted ? 'bg-green-500/30' : 'bg-border-primary'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {children}
    </div>
  )
}
