export function ReelCardSkeleton() {
  return (
    <div className="calm-card w-full animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="relative aspect-[9/16] w-full rounded-lg overflow-hidden mb-3 bg-gray-200" />

      {/* Title skeleton */}
      <div className="space-y-2 mb-2">
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-4 bg-gray-300 rounded w-1/2" />
      </div>

      {/* Summary skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-1.5 mb-3">
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
        <div className="h-6 w-14 bg-gray-200 rounded-full" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
