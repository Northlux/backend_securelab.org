'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import {
  getIngestionLogs,
  deleteIngestionLog,
} from '@/app/actions/intel/logs'

interface IngestionLog {
  id: string
  source_id: string | null
  status: 'success' | 'error' | 'pending'
  signals_found: number
  signals_imported: number
  signals_skipped: number
  signals_errored: number
  error_message: string | null
  started_at: string
  completed_at: string | null
}

interface LogsClientProps {
  initialLogs: IngestionLog[]
}

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    success: 'bg-green-500/20 text-green-300',
    error: 'bg-red-500/20 text-red-300',
    pending: 'bg-yellow-500/20 text-yellow-300',
  }
  return colors[status] || colors.pending
}

export default function LogsClient({ initialLogs }: LogsClientProps) {
  const [logs, setLogs] = useState<IngestionLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm('Delete this log?')) {
      setLoading(true)
      setError(null)
      try {
        await deleteIngestionLog(id)
        const { data } = await getIngestionLogs(1, 50)
        setLogs(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete log')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Ingestion Logs</h1>
        <p className="text-sm text-slate-400 mt-1">Monitor data import activity and troubleshoot errors</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No ingestion logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Timestamp</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-200">Found</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-200">Imported</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-200">Skipped</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-200">Errors</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-100">
                        {new Date(log.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(log.status)}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-300">
                        {log.signals_found}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-green-300">
                        {log.signals_imported}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-yellow-300">
                        {log.signals_skipped}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-red-300">
                        {log.signals_errored}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
                            title="View details"
                          >
                            {expandedId === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            disabled={loading}
                            className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-slate-900/30">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-2 text-sm text-slate-300">
                            {log.completed_at && (
                              <div>
                                <span className="font-semibold">Completed:</span> {new Date(log.completed_at).toLocaleString()}
                              </div>
                            )}
                            {log.error_message && (
                              <div className="bg-red-500/20 border border-red-500/50 rounded p-2 text-red-200">
                                <span className="font-semibold">Error:</span> {log.error_message}
                              </div>
                            )}
                            <div className="grid grid-cols-4 gap-4 mt-2">
                              <div>
                                <div className="text-xs text-slate-400">Found</div>
                                <div className="font-semibold">{log.signals_found}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400">Imported</div>
                                <div className="font-semibold text-green-300">{log.signals_imported}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400">Skipped</div>
                                <div className="font-semibold text-yellow-300">{log.signals_skipped}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400">Errored</div>
                                <div className="font-semibold text-red-300">{log.signals_errored}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
