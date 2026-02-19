import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Intel Management — Securelab Admin',
}
import { IntelQueue } from '@/app/components/intel/intel-queue'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

function IntelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 bg-slate-800/40" />
        ))}
      </div>
      <Skeleton className="h-12 bg-slate-800/40" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 bg-slate-800/40" />
        ))}
      </div>
    </div>
  )
}

export default function IntelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Intel Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, approve, and manage cybersecurity intelligence signals
        </p>
      </div>

      <Suspense fallback={<IntelSkeleton />}>
        <IntelQueue />
      </Suspense>
    </div>
  )
}
