import { CardSkeleton, KeywordsSkeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-[radial-gradient(ellipse_at_top,_rgba(167,139,250,0.08),transparent_50%)] text-foreground">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-8 skeleton-shimmer rounded w-64" />
          <div className="h-4 skeleton-shimmer rounded w-96" />
        </div>

        {/* Input area skeleton */}
        <div className="h-48 bg-[#111111] border border-[#262626] rounded-lg skeleton-shimmer" />

        {/* Results skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <KeywordsSkeleton />
        </div>
      </div>
    </div>
  );
}
