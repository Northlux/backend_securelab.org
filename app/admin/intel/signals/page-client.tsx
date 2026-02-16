'use client'

import { useState } from 'react'
import { Trash2, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import {
  getSignals,
  deleteSignal,
  approveSignal,
  rejectSignal,
} from '@/app/actions/intel/signals'
import {
  bulkDeleteSignals,
  bulkMarkAsVerified,
} from '@/app/actions/intel/bulk-operations'
import { BulkOperationsToolbar } from '@/app/components/admin/bulk-operations-toolbar'
import { SignalDetailModal } from '@/app/components/admin/signals-detail-modal'

interface Signal {
  id: string
  title: string
  summary: string | null
  full_content: string | null
  severity: string
  signal_category: string
  created_at: string
  publication_status: string
  rejection_reason: string | null
  is_verified: boolean
  is_featured: boolean
  confidence_level: number
  cve_ids: string[]
  threat_actors: string[]
  target_industries: string[]
  target_regions: string[]
  affected_products: string[]
  source_url: string | null
  source_id: string | null
  approved_at: string | null
  rejected_at: string | null
}

interface SignalsClientProps {
  initialSignals: Signal[]
  initialCount: number | null
}

export default function SignalsClient({ initialSignals, initialCount }: SignalsClientProps) {
  const [signals, setSignals] = useState<Signal[]>(initialSignals)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialCount || 0)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    severity: '',
    category: '',
    search: '',
    status: 'pending', // Default to show only pending signals
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const pageSize = 20

  const handleFilterChange = async (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(1)
    await loadSignals(1, newFilters)
  }

  const loadSignals = async (pageNum: number, filterObj?: typeof filters) => {
    setLoading(true)
    setError(null)
    try {
      const f = filterObj || filters
      const { data, count } = await getSignals(pageNum, pageSize, {
        severity: f.severity || undefined,
        category: f.category || undefined,
        search: f.search || undefined,
        status: f.status || undefined,
      })
      setSignals(data || [])
      setTotal(count || 0)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signals')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this signal?')) {
      setLoading(true)
      setError(null)
      try {
        await deleteSignal(id)
        await loadSignals(page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete signal')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleApproveQuick = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await approveSignal(id)
      await loadSignals(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectQuick = async (id: string, reason: 'ad' | 'irrelevant' | 'bad_content') => {
    setLoading(true)
    setError(null)
    try {
      await rejectSignal(id, reason)
      await loadSignals(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === signals.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(signals.map((s) => s.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} signal(s)? This cannot be undone.`)) return

    setLoading(true)
    setError(null)
    try {
      await bulkDeleteSignals(Array.from(selectedIds))
      setSelectedIds(new Set())
      await loadSignals(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete signals')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkMarkVerified = async () => {
    if (selectedIds.size === 0) return

    setLoading(true)
    setError(null)
    try {
      await bulkMarkAsVerified(Array.from(selectedIds))
      setSelectedIds(new Set())
      await loadSignals(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as verified')
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
      approved: 'bg-green-500/20 border-green-500/30 text-green-300',
      rejected: 'bg-red-500/20 border-red-500/30 text-red-300',
      archived: 'bg-slate-500/20 border-slate-500/30 text-slate-300',
    }
    return colors[status] || colors.pending
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
        <p className="text-sm text-slate-400 mt-1">Review and moderate threat intelligence signals for publication</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search signals..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            disabled={loading}
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none"
            disabled={loading}
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All Status</option>
          </select>
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange({ ...filters, severity: e.target.value })}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none"
            disabled={loading}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange({ ...filters, category: e.target.value })}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none"
            disabled={loading}
          >
            <option value="">All Categories</option>
            <option value="vulnerability">Vulnerability</option>
            <option value="malware">Malware</option>
            <option value="breach">Breach</option>
            <option value="threat_actor">Threat Actor</option>
            <option value="exploit">Exploit</option>
            <option value="ransomware">Ransomware</option>
          </select>
          <div className="text-sm text-slate-400 flex items-center justify-end">
            {total} signals total
          </div>
        </div>
      </div>

      {/* Signals Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {signals.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No signals found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === signals.length}
                      onChange={toggleSelectAll}
                      disabled={loading}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Severity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Date</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {signals.map((signal) => (
                  <tr
                    key={signal.id}
                    onClick={() => {
                      setSelectedSignal(signal)
                      setShowDetailModal(true)
                    }}
                    className={`transition-colors cursor-pointer ${
                      selectedIds.has(signal.id) ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(signal.id)}
                        onChange={() => toggleSelection(signal.id)}
                        disabled={loading}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-sm">
                        <p className="text-sm text-slate-100 font-medium line-clamp-2">{signal.title}</p>
                        {signal.summary && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{signal.summary}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${statusColor(
                          signal.publication_status || 'pending'
                        )}`}
                      >
                        {signal.publication_status
                          ? signal.publication_status.charAt(0).toUpperCase() + signal.publication_status.slice(1)
                          : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${severityColor(signal.severity)}`}>
                        {signal.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(signal.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                        {/* Quick Approve (pending only) */}
                        {signal.publication_status === 'pending' && (
                          <button
                            onClick={() => handleApproveQuick(signal.id)}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:text-green-400 disabled:opacity-50 transition-colors"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                        )}

                        {/* Quick Reject (pending only) */}
                        {signal.publication_status === 'pending' && (
                          <button
                            onClick={() => handleRejectQuick(signal.id, 'irrelevant')}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:text-red-400 disabled:opacity-50 transition-colors"
                            title="Quick reject"
                          >
                            <X size={16} />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(signal.id)}
                          disabled={loading}
                          className="p-1.5 text-slate-400 hover:text-red-400 disabled:opacity-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => loadSignals(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => loadSignals(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Operations Toolbar */}
      <BulkOperationsToolbar
        selectedCount={selectedIds.size}
        loading={loading}
        onDelete={handleBulkDelete}
        onMarkVerified={handleBulkMarkVerified}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Detail Modal */}
      <SignalDetailModal
        signal={selectedSignal}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedSignal(null)
        }}
        onAction={() => loadSignals(page)}
      />
    </div>
  )
}
