import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-72 bg-slate-800/60" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 space-y-4">
            <Skeleton className="h-3 w-24 bg-slate-700" />
            <Skeleton className="h-8 w-16 bg-slate-700" />
            <Skeleton className="h-3 w-32 bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full bg-slate-800/40" />
        ))}
      </div>
    </div>
  )
}
