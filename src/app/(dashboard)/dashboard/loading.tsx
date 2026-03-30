import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl">
      {/* Greeting */}
      <div className="mb-8 space-y-2">
        <Skeleton variant="title" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="md">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="title" className="mt-2" />
            <Skeleton variant="text" width="40%" className="mt-1" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card padding="sm">
            <div className="px-4 py-3">
              <Skeleton variant="text" width="30%" />
            </div>
            <div className="px-4 py-3 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="40%" />
                  </div>
                  <Skeleton variant="text" width="60px" />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card padding="sm">
            <div className="px-4 py-3">
              <Skeleton variant="text" width="40%" />
            </div>
            <div className="px-4 py-3 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="text" />
              ))}
            </div>
          </Card>
          <Skeleton variant="card" />
        </div>
      </div>
    </div>
  )
}
