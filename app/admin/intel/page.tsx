import { Suspense } from 'react'
import { IntelQueue } from '@/app/components/intel/intel-queue'
import { RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function IntelPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-600 text-slate-100 mb-1">Intel Management</h1>
        <p className="text-sm text-slate-500">
          Review, approve, and manage cybersecurity intelligence signals
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={20} className="text-slate-600 animate-spin" />
          </div>
        }
      >
        <IntelQueue />
      </Suspense>
    </>
  )
}
