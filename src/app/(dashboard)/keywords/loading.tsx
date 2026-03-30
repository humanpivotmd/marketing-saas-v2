import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function KeywordsLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl">
      <div className="mb-6 space-y-2">
        <Skeleton variant="title" width="40%" />
        <Skeleton variant="text" width="70%" />
      </div>

      {/* 검색 폼 */}
      <Card className="mb-6">
        <Skeleton variant="text" width="30%" className="mb-4" />
        <div className="flex gap-3">
          <Skeleton variant="text" className="flex-1" height="44px" />
          <Skeleton variant="text" width="80px" height="44px" />
        </div>
      </Card>

      {/* 목록 헤더 */}
      <div className="mb-4">
        <Skeleton variant="text" width="30%" />
      </div>

      {/* 키워드 리스트 */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <Skeleton variant="text" width="16px" height="16px" />
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="40px" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
