'use client'

import Card from '@/components/ui/Card'
import type { GradeResult } from '@/lib/grade'
import type { Keyword } from '@/types'

interface KeywordMetricsProps {
  keyword: Keyword
  gradeResult: GradeResult | null
  mode: 'beginner' | 'expert'
  gradeStyle: { bg: string; text: string; border: string }
  analyzingGrade: boolean
  grade: string | null
}

export default function KeywordMetrics({ keyword, gradeResult, mode, gradeStyle, analyzingGrade, grade }: KeywordMetricsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Grade Card */}
      <Card className={`border ${gradeStyle.border}`}>
        <div className="text-center">
          <p className="text-sm text-text-tertiary mb-2">키워드 등급</p>
          <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center ${gradeStyle.bg} mb-3`}>
            <span className={`text-4xl font-bold ${gradeStyle.text}`}>
              {analyzingGrade ? '...' : grade || '?'}
            </span>
          </div>
          {gradeResult && (
            <>
              <p className="text-sm font-medium text-text-primary">{gradeResult.difficulty}</p>
              <p className="text-xs text-text-tertiary mt-1">기회: {gradeResult.opportunity}</p>
              <p className="text-xs text-text-tertiary">점수: {gradeResult.total_score}점</p>
            </>
          )}
        </div>
      </Card>

      {/* Metrics */}
      <Card className="lg:col-span-2">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          {mode === 'beginner' ? '이 키워드의 핵심 수치' : '검색 지표'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-text-tertiary">{mode === 'beginner' ? '한 달 검색 수' : '월간 검색량'}</p>
            <p className="text-xl font-bold text-text-primary">
              {(gradeResult?.monthly_search ?? keyword.monthly_search)?.toLocaleString() || '-'}
            </p>
            {mode === 'beginner' && <p className="text-[10px] text-text-tertiary mt-0.5">많을수록 관심이 높은 키워드</p>}
          </div>
          <div>
            <p className="text-xs text-text-tertiary">{mode === 'beginner' ? '관련 글 수' : '월간 발행량'}</p>
            <p className="text-xl font-bold text-text-primary">{gradeResult?.monthly_publish?.toLocaleString() || '-'}</p>
            {mode === 'beginner' && <p className="text-[10px] text-text-tertiary mt-0.5">적을수록 기회가 많아요</p>}
          </div>
          <div>
            <p className="text-xs text-text-tertiary">{mode === 'beginner' ? '경쟁 정도' : '포화도'}</p>
            <p className="text-xl font-bold text-text-primary">{gradeResult ? `${gradeResult.saturation.toFixed(1)}%` : '-'}</p>
            {mode === 'beginner' && <p className="text-[10px] text-text-tertiary mt-0.5">낮을수록 노출되기 쉬워요</p>}
          </div>
          <div>
            <p className="text-xs text-text-tertiary">{mode === 'beginner' ? '광고 단가' : '평균 CPC'}</p>
            <p className="text-xl font-bold text-text-primary">
              {(gradeResult?.avg_cpc ?? keyword.cpc) ? `${(gradeResult?.avg_cpc ?? keyword.cpc)?.toLocaleString()}원` : '-'}
            </p>
            {mode === 'beginner' && <p className="text-[10px] text-text-tertiary mt-0.5">높을수록 가치있는 키워드</p>}
          </div>
        </div>
        {mode === 'expert' && gradeResult && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[rgba(240,246,252,0.1)]">
            <div>
              <p className="text-xs text-text-tertiary">노출 유지 기간</p>
              <p className="text-lg font-semibold text-text-primary">{gradeResult.exposure_days}일</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary">트렌드</p>
              <p className={`text-lg font-semibold ${
                gradeResult.trend === '상승' ? 'text-accent-success' :
                gradeResult.trend === '하락' ? 'text-accent-error' : 'text-text-primary'
              }`}>
                {gradeResult.trend}
                {gradeResult.trend_change !== 0 && ` (${gradeResult.trend_change > 0 ? '+' : ''}${gradeResult.trend_change}%)`}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
