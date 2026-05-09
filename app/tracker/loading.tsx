export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-[radial-gradient(ellipse_at_top,_rgba(167,139,250,0.08),transparent_50%)] text-foreground flex flex-col">
      <div className="flex-1 px-4 md:px-8 max-w-[1600px] mx-auto w-full flex flex-col pt-12 pb-4">
        {/* Header skeleton */}
        <div className="flex justify-between items-start mb-10 gap-4 border-b border-white/[0.06] pb-8">
          <div className="space-y-2">
            <div className="h-8 skeleton-shimmer rounded w-56" />
            <div className="h-4 skeleton-shimmer rounded w-72" />
          </div>
          <div className="h-10 skeleton-shimmer rounded-lg w-36" />
        </div>

        {/* Kanban columns skeleton */}
        <div className="flex xl:grid xl:grid-cols-5 gap-4 h-full min-h-[500px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[280px] xl:min-w-0 w-full flex-shrink-0 flex flex-col bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 min-h-[500px]">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                <div className="w-2 h-2 rounded-full skeleton-shimmer" />
                <div className="h-4 skeleton-shimmer rounded w-20" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
                  <div key={j} className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4 space-y-2">
                    <div className="h-4 skeleton-shimmer rounded w-3/4" />
                    <div className="h-3 skeleton-shimmer rounded w-1/2" />
                    <div className="h-3 skeleton-shimmer rounded w-1/3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
