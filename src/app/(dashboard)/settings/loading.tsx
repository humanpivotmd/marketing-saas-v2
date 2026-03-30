import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <Skeleton variant="title" width="20%" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[rgba(240,246,252,0.1)] pb-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="text" width="80px" height="36px" />
        ))}
      </div>

      {/* Tab content skeleton */}
      <Card>
        <Skeleton variant="text" width="30%" className="mb-4" />
        <div className="space-y-4">
          <div>
            <Skeleton variant="text" width="20%" className="mb-1" />
            <Skeleton variant="text" height="44px" />
          </div>
          <div>
            <Skeleton variant="text" width="25%" className="mb-1" />
            <Skeleton variant="text" height="44px" />
          </div>
          <div>
            <Skeleton variant="text" width="20%" className="mb-1" />
            <Skeleton variant="text" height="44px" />
          </div>
        </div>
      </Card>

      <Card>
        <Skeleton variant="text" width="25%" className="mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="text" height="60px" />
          ))}
        </div>
      </Card>
    </div>
  )
}
