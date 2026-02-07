'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface IngestionLog {
  id: string
  source_id: string
  status: string
  signals_found: number
  signals_processed: number
  error_message: string | null
  processed_at: string
  source: { name: string }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<IngestionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    source: '',
  })

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    setLoading(true)
    let query = supabase
      .from('ingestion_logs')
      .select('*, source:sources(name)')

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.source) {
      query = query.eq('source_id', filters.source)
    }

    const { data, error } = await query
      .order('processed_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setLogs(data)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this log?')) {
      const { error } = await supabase
        .from('ingestion_logs')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchLogs()
      }
    }
  }

  const handleClearOldLogs = async () => {
    if (confirm('Delete all logs older than 30 days?')) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error } = await supabase
        .from('ingestion_logs')
        .delete()
        .lt('processed_at', thirtyDaysAgo.toISOString())

      if (!error) {
        fetchLogs()
      }
    }
  }

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-500/20 text-green-300',
      error: 'bg-red-500/20 text-red-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
    }
    return colors[status] || colors.pending
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Ingestion Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor threat intelligence data ingestion</p>
        </div>
        <button
          onClick={handleClearOldLogs}
          className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
        >
          Clear Old Logs
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-6 text-center text-slate-400 bg-slate-800/50 border border-slate-700 rounded-lg">
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-800/50 border border-slate-700 rounded-lg">
            No ingestion logs
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-700/30 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-slate-100">{log.source?.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(log.status)}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-400">
                    <span>Found: {log.signals_found}</span>
                    <span>Processed: {log.signals_processed}</span>
                    <span>{new Date(log.processed_at).toLocaleString()}</span>
                  </div>
                </div>
                {expandedId === log.id ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>

              {expandedId === log.id && (
                <div className="border-t border-slate-700 bg-slate-900/30 px-6 py-4 space-y-4">
                  {log.error_message && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-300 mb-2">Error</h4>
                      <p className="text-sm text-slate-300 bg-red-950/20 border border-red-900/30 rounded p-3 font-mono text-xs">
                        {log.error_message}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 mb-1">Source ID</p>
                      <p className="text-slate-100 font-mono text-xs">{log.source_id}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Log ID</p>
                      <p className="text-slate-100 font-mono text-xs">{log.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="px-3 py-1.5 text-xs bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete Log
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
