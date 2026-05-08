export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-[#262626] bg-[#111111] p-6 space-y-3 animate-pulse">
      <div className="h-4 bg-[#262626] rounded w-1/3" />
      <div className="h-3 bg-[#262626] rounded w-full" />
      <div className="h-3 bg-[#262626] rounded w-4/5" />
      <div className="h-3 bg-[#262626] rounded w-2/3" />
    </div>
  )
}

export function KeywordsSkeleton() {
  return (
    <div className="rounded-lg border border-[#262626] bg-[#111111] p-6 animate-pulse">
      <div className="h-4 bg-[#262626] rounded w-1/4 mb-4" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-6 bg-[#262626] rounded-full w-20" />
        ))}
      </div>
    </div>
  )
}

export function BulletSkeleton() {
  return (
    <div className="rounded-lg border border-[#262626] bg-[#111111] p-6 space-y-2 animate-pulse">
      <div className="h-3 bg-[#262626] rounded w-full" />
      <div className="h-3 bg-[#262626] rounded w-5/6" />
      <div className="h-3 bg-[#262626] rounded w-1/4 mt-2" />
    </div>
  )
}

export function PlanDaySkeleton() {
  return (
    <div className="rounded-lg border border-[#262626] bg-[#111111] p-6 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-[#262626] rounded-full" />
        <div className="h-4 bg-[#262626] rounded w-1/3" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-3 bg-[#262626] rounded w-full" />
      ))}
    </div>
  )
}
