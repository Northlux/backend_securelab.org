'use client'

import { CheckCircle, XCircle, X, Star } from 'lucide-react'

export function BulkActions({
  count,
  onAction,
  onClear,
  loading,
}: {
  count: number
  onAction: (action: string) => void
  onClear: () => void
  loading: boolean
}) {
  if (count === 0) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-brand-500/10 border border-brand-500/20 rounded-lg animate-in fade-in">
      <span className="text-sm font-500 text-brand-300">
        {count} selected
      </span>

      <div className="flex items-center gap-2 ml-2">
        <button
          onClick={() => onAction('approve')}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-500 bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all disabled:opacity-50"
        >
          <CheckCircle size={14} />
          Approve All
        </button>
        <button
          onClick={() => onAction('reject')}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-500 bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-50"
        >
          <XCircle size={14} />
          Reject All
        </button>
        <button
          onClick={() => onAction('feature')}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-500 bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 transition-all disabled:opacity-50"
        >
          <Star size={14} />
          Feature
        </button>
      </div>

      <button
        onClick={onClear}
        className="ml-auto p-1 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
