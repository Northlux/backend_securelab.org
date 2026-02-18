/**
 * Ingestion Logs Page
 *
 * Shows recent pipeline activity: which sources ran, how many
 * signals were imported/skipped, and any errors.
 */
'use client'

import { useEffect, useState } from 'react'
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Filter,
} from 'lucide-react'

interface LogEntry {
  id: string
  source_id: string
  status: string
  signals_imported: number
  signals_skipped: number
  error_message: string
  created_at: string
  completed_at: string | null
}

const STATUS_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  success: { icon: <CheckCircle size={14} />, color: 'text-green-400 bg-green-500/10' },
  error: { icon: <XCircle size={14} />, color: 'text-red-400 bg-red-500/10' },
  partial: { icon: <AlertTriangle size={14} />, color: 'text-yellow-400 bg-yellow-500/10' },
  running: { icon: <RefreshCw size={14} className="animate-spin" />, color: 'text-blue-400 bg-blue-500/10' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '100')
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/v1/admin/logs?${params.toString()}`)
      const json = await res.json()
      setLogs(json.data || [])
    } catch {
      // silent
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [statusFilter])

  // Stats
  const successCount = logs.filter((l) => l.status === 'success').length
  const errorCount = logs.filter((l) => l.status === 'error').length
  const totalImported = logs.reduce((sum, l) => sum + (l.signals_imported || 0), 0)

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-600 text-slate-100 mb-1">Ingestion Logs</h1>
          <p className="text-sm text-slate-500">
            Pipeline activity · {logs.length} entries · {totalImported} signals imported
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 text-xs font-500 text-slate-400 hover:text-slate-200 bg-slate-800/40 border border-slate-800 rounded-lg hover:border-slate-700 transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Successful</div>
          <div className="text-2xl font-600 text-green-400">{successCount}</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Errors</div>
          <div className="text-2xl font-600 text-red-400">{errorCount}</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Signals Imported</div>
          <div className="text-2xl font-600 text-brand-400">{totalImported}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Log entries */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="text-slate-600 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={32} className="text-slate-700 mx-auto mb-4" />
            <p className="text-sm text-slate-500">No ingestion logs found.</p>
          </div>
        ) : (
          logs.map((log) => {
            const style = STATUS_STYLES[log.status] ?? { icon: <CheckCircle size={14} />, color: 'text-slate-400 bg-slate-500/10' }
            return (
              <div
                key={log.id}
                className="flex items-center gap-4 p-4 bg-slate-800/40 border border-slate-800 rounded-lg hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-150"
              >
                {/* Status icon */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${style.color}`}>
                  {style.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-500 text-slate-200">
                      {log.source_id ? log.source_id.slice(0, 8) : 'Unknown'}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${style.color}`}>
                      {log.status}
                    </span>
                  </div>
                  {log.error_message && (
                    <p className="text-xs text-red-400/80 mt-1 truncate">
                      {log.error_message}
                    </p>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Download size={12} className="text-green-500" />
                    {log.signals_imported}
                  </span>
                  <span className="flex items-center gap-1">
                    <Filter size={12} className="text-slate-600" />
                    {log.signals_skipped} skipped
                  </span>
                </div>

                {/* Time */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-slate-500">{timeAgo(log.created_at)}</div>
                  <div className="text-xs text-slate-600">{formatTimestamp(log.created_at)}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
