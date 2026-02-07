'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Signal {
  id: string
  title: string
  description: string
  severity: string
  category: string
  source_id: string
  published_at: string
  source: { name: string }
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    severity: '',
    category: '',
    search: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Signal>>({})

  const pageSize = 20

  useEffect(() => {
    fetchSignals()
  }, [page, filters])

  const fetchSignals = async () => {
    setLoading(true)
    let query = supabase
      .from('signals')
      .select('*, source:sources(name)', { count: 'exact' })

    if (filters.severity) {
      query = query.eq('severity', filters.severity)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error, count } = await query
      .order('published_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (!error && data) {
      setSignals(data)
      setTotal(count || 0)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this signal?')) {
      const { error } = await supabase.from('signals').delete().eq('id', id)
      if (!error) {
        fetchSignals()
      }
    }
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('signals')
      .update(editData)
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      setEditData({})
      fetchSignals()
    }
  }

  const severityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-300',
      high: 'bg-orange-500/20 text-orange-300',
      medium: 'bg-yellow-500/20 text-yellow-300',
      low: 'bg-blue-500/20 text-blue-300',
      info: 'bg-slate-500/20 text-slate-300',
    }
    return colors[severity] || colors.info
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Threat Signals</h1>
        <p className="text-sm text-slate-400 mt-1">Manage and moderate threat intelligence signals</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search signals..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value })
              setPage(1)
            }}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
          <select
            value={filters.severity}
            onChange={(e) => {
              setFilters({ ...filters, severity: e.target.value })
              setPage(1)
            }}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => {
              setFilters({ ...filters, category: e.target.value })
              setPage(1)
            }}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="vulnerability">Vulnerability</option>
            <option value="breach">Breach</option>
            <option value="malware">Malware</option>
            <option value="threat">Threat</option>
          </select>
          <div className="text-sm text-slate-400 flex items-center">
            {total} signals total
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-400">Loading signals...</div>
        ) : signals.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No signals found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Severity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Source</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {signals.map((signal) => (
                <tr key={signal.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-slate-100 font-medium truncate">{signal.title}</p>
                      {editingId === signal.id && (
                        <textarea
                          value={editData.description || signal.description}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          className="mt-2 w-full px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-100"
                          rows={2}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === signal.id ? (
                      <select
                        value={editData.severity || signal.severity}
                        onChange={(e) => setEditData({ ...editData, severity: e.target.value })}
                        className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-100"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="info">Info</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${severityColor(signal.severity)}`}>
                        {signal.severity.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{signal.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{signal.source?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(signal.published_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {editingId === signal.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(signal.id)}
                            className="px-2 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(signal.id)
                              setEditData(signal)
                            }}
                            className="p-1 text-slate-400 hover:text-brand-400 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(signal.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
