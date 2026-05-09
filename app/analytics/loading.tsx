import { CardSkeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 w-full">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 skeleton-shimmer rounded w-64" />
          <div className="h-4 skeleton-shimmer rounded w-48" />
        </div>

        {/* KPI cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[350px]">
              <CardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
