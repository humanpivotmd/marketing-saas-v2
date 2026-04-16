'use client'

import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface Opportunity {
  keyword: string
  opportunity_score: number
  search_volume: number
  competition_level: string
  trend_direction: string
}

interface OpportunityListProps {
  opportunities: Opportunity[]
  mode: 'beginner' | 'expert'
}

export default function OpportunityList({ opportunities, mode }: OpportunityListProps) {
  return (
    <Card className="mb-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">키워드 기회 추천</h3>
      {opportunities.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-6">
          아직 추천 데이터가 없습니다. 더 많은 키워드를 분석하면 추천이 생성됩니다.
        </p>
      ) : (
        <div className="space-y-2">
          {opportunities.slice(0, 5).map((opp) => (
            <div key={opp.keyword} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-primary/50 hover:bg-bg-tertiary/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text-primary">{opp.keyword}</span>
                <Badge
                  variant={opp.trend_direction === 'rising' ? 'success' : opp.trend_direction === 'declining' ? 'error' : 'default'}
                  size="sm"
                >
                  {opp.trend_direction === 'rising' ? '상승' : opp.trend_direction === 'declining' ? '하락' : '안정'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                {mode === 'expert' && <span>검색량 {opp.search_volume?.toLocaleString() || '-'}</span>}
                <span className="font-semibold text-accent-primary">{opp.opportunity_score}점</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
