'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle size={24} className="text-red-400" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-slate-200">Something went wrong</h2>
        <p className="text-sm text-slate-500 max-w-md">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={reset}
        className="border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        <RefreshCw size={14} className="mr-2" />
        Try again
      </Button>
    </div>
  )
}
