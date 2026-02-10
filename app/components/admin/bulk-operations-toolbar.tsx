'use client'

import { Trash2, AlertCircle, CheckCircle } from 'lucide-react'

interface BulkOperationsToolbarProps {
  selectedCount: number
  loading?: boolean
  onDelete?: () => void
  onMarkVerified?: () => void
  onClearSelection?: () => void
  severity?: string
  onSeverityChange?: (severity: string) => void
  onBulkSeverityUpdate?: () => void
}

export function BulkOperationsToolbar({
  selectedCount,
  loading = false,
  onDelete,
  onMarkVerified,
  onClearSelection,
  severity = 'medium',
  onSeverityChange,
  onBulkSeverityUpdate,
}: BulkOperationsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 shadow-lg z-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-brand-400" />
            <span className="text-slate-100">
              <span className="font-semibold">{selectedCount}</span>
              {selectedCount === 1 ? ' signal selected' : ' signals selected'}
            </span>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2 flex-1 md:flex-initial">
            {/* Severity Update */}
            <div className="flex gap-2">
              <select
                value={severity}
                onChange={(e) => onSeverityChange?.(e.target.value)}
                disabled={loading}
                className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none disabled:opacity-50"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
              <button
                onClick={onBulkSeverityUpdate}
                disabled={loading}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                Update Severity
              </button>
            </div>

            {/* Mark Verified */}
            <button
              onClick={onMarkVerified}
              disabled={loading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Mark Verified
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              disabled={loading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </button>

            {/* Clear Selection */}
            <button
              onClick={onClearSelection}
              disabled={loading}
              className="px-4 py-2 text-sm bg-slate-700 text-slate-100 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
