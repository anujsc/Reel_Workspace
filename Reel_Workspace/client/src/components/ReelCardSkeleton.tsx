export function ReelCardSkeleton() {
  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Horizontal Layout matching ReelCard */}
      <div className="flex gap-4 p-4">
        {/* Compact Thumbnail Skeleton */}
        <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted skeleton-shimmer" />

        {/* Content Section */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Title Skeleton - 2 lines */}
          <div className="space-y-2">
            <div className="h-4 bg-muted skeleton-shimmer rounded w-full" />
            <div className="h-4 bg-muted skeleton-shimmer rounded w-3/4" />
          </div>

          {/* Summary Skeleton - 2 lines */}
          <div className="space-y-2 mt-1">
            <div className="h-3 bg-muted/70 skeleton-shimmer rounded w-full" />
            <div className="h-3 bg-muted/70 skeleton-shimmer rounded w-5/6" />
          </div>

          {/* Tags Skeleton */}
          <div className="flex gap-1.5 mt-auto">
            <div className="h-5 w-16 bg-muted/60 skeleton-shimmer rounded-md" />
            <div className="h-5 w-20 bg-muted/60 skeleton-shimmer rounded-md" />
          </div>
        </div>

        {/* Action Menu Placeholder */}
        <div className="flex-shrink-0 w-8" />
      </div>

      {/* Footer Metadata Skeleton */}
      <div className="px-4 pb-3 flex items-center justify-between border-t border-border/50 pt-2">
        <div className="h-3 w-24 bg-muted/50 skeleton-shimmer rounded" />
        <div className="h-3 w-20 bg-muted/50 skeleton-shimmer rounded" />
      </div>
    </div>
  );
}
