'use client'

import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

interface TrendData {
  keyword: string
  data: { date: string; ratio: number }[]
}

interface TrendChartProps {
  trends: TrendData[]
  loading: boolean
}

export default function TrendChart({ trends, loading }: TrendChartProps) {
  return (
    <Card className="mb-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        검색 트렌드 (최근 12개월)
      </h3>
      {loading ? (
        <Skeleton variant="card" height="200px" />
      ) : trends.length > 0 && trends[0].data.length > 0 ? (
        <div className="relative h-48">
          <div className="flex items-end justify-between h-full gap-1">
            {trends[0].data.map((point, i) => {
              const maxRatio = Math.max(...trends[0].data.map((d) => d.ratio), 1)
              const height = (point.ratio / maxRatio) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-accent-primary/30 rounded-t-sm hover:bg-accent-primary/50 transition-colors relative group"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs text-text-primary bg-bg-tertiary px-1.5 py-0.5 rounded whitespace-nowrap">
                      {point.ratio.toFixed(0)}
                    </div>
                  </div>
                  <span className="text-[10px] text-text-tertiary truncate w-full text-center">
                    {point.date.slice(5, 7)}월
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-8">트렌드 데이터가 없습니다.</p>
      )}
    </Card>
  )
}
