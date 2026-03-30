import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function ContentsLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton variant="title" width="30%" />
          <Skeleton variant="text" width="50%" />
        </div>
        <Skeleton variant="text" width="140px" height="44px" />
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <Skeleton variant="text" className="flex-1" height="44px" />
        <Skeleton variant="text" width="100px" height="44px" />
      </div>

      {/* 프로젝트 카드 스켈레톤 */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="40px" />
                </div>
                <Skeleton variant="text" width="30%" />
                <div className="flex gap-2 mt-1">
                  <Skeleton variant="text" width="80px" />
                  <Skeleton variant="text" width="80px" />
                  <Skeleton variant="text" width="80px" />
                </div>
              </div>
              <Skeleton variant="text" width="60px" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
