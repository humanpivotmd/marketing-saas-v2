import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function CalendarLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 space-y-2">
        <Skeleton variant="title" width="30%" />
        <Skeleton variant="text" width="50%" />
      </div>

      {/* 안내 문구 */}
      <Skeleton variant="text" height="44px" className="mb-6" />

      {/* 색상 범례 */}
      <div className="flex gap-4 mb-4">
        <Skeleton variant="text" width="100px" />
        <Skeleton variant="text" width="120px" />
        <Skeleton variant="text" width="80px" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 캘린더 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4 px-2">
              <Skeleton variant="text" width="30px" />
              <Skeleton variant="text" width="120px" />
              <Skeleton variant="text" width="30px" />
            </div>
            {/* 7x6 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }).map((_, i) => (
                <Skeleton key={i} variant="text" height="60px" />
              ))}
            </div>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          <Card>
            <Skeleton variant="text" width="50%" className="mb-3" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" className="mt-2" />
          </Card>
          <Card>
            <Skeleton variant="text" width="40%" className="mb-3" />
            <div className="space-y-2">
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
