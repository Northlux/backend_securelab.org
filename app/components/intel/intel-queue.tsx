'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { SignalCard } from './signal-card'
import { SignalFilters } from './signal-filters'
import { BulkActions } from './bulk-actions'
import { ToastContainer, showToast } from './toast'

interface TriageResult {
  id: string
  kimi_score: number | null
  openai_score: number | null
  triage_status: string
  processed_summary: string | null
  polished_content: string | null
}

interface Signal {
  id: string
  title: string
  summary: string | null
  signal_category: string
  severity: string
  source_url: string | null
  source_date: string | null
  created_at: string
  is_featured: boolean
  is_verified: boolean
  triage_results: TriageResult[] | TriageResult | null
}

interface StatsData {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  bySeverity: Record<string, number>
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function IntelQueue() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [signals, setSignals] = useState<Signal[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchSignals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      const res = await fetch(`/api/v1/admin/signals?${params.toString()}`)
      const json = await res.json()
      setSignals(json.data || [])
      setPagination(json.pagination || null)
    } catch {
      showToast('error', 'Failed to load signals')
    }
    setLoading(false)
  }, [searchParams])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/signals/stats')
      const json = await res.json()
      setStats(json)
    } catch {
      // stats are optional
    }
  }, [])

  useEffect(() => {
    fetchSignals()
    fetchStats()
  }, [fetchSignals, fetchStats])

  const handleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const [rejectModal, setRejectModal] = useState<string | null>(null)

  const handleAction = async (id: string, action: string, rejectionReason?: string) => {
    try {
      if (action === 'reject' && !rejectionReason) {
        // Show rejection reason modal
        setRejectModal(id)
        return
      }

      const body: Record<string, unknown> = {
        triage_status: action === 'approve' ? 'approved' : 'rejected',
      }
      if (rejectionReason) {
        body.rejection_reason = rejectionReason
      }

      const res = await fetch(`/api/v1/admin/signals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast('success', `Signal ${action}d`)
        setRejectModal(null)
        fetchSignals()
        fetchStats()
      } else {
        showToast('error', `Failed to ${action} signal`)
      }
    } catch {
      showToast('error', 'Network error')
    }
  }

  const [bulkRejectModal, setBulkRejectModal] = useState(false)

  const handleBulkAction = async (action: string, rejectionReason?: string) => {
    if (selected.size === 0) return

    // Intercept bulk reject to show reason modal
    if (action === 'reject' && !rejectionReason) {
      setBulkRejectModal(true)
      return
    }

    setBulkLoading(true)
    try {
      const body: Record<string, unknown> = { action, ids: Array.from(selected) }
      if (rejectionReason) body.rejection_reason = rejectionReason

      const res = await fetch('/api/v1/admin/signals/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        showToast('success', `${json.updated} signals updated`)
        setSelected(new Set())
        setBulkRejectModal(false)
        fetchSignals()
        fetchStats()
      } else {
        showToast('error', json.errors?.[0] || 'Bulk action failed')
      }
    } catch {
      showToast('error', 'Network error')
    }
    setBulkLoading(false)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/admin/intel?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Signals" value={stats.total} />
          <StatCard
            label="Pending"
            value={stats.byStatus.pending || 0}
            accent="text-slate-400"
          />
          <StatCard
            label="Approved"
            value={stats.byStatus.approved || 0}
            accent="text-green-400"
          />
          <StatCard
            label="In Review"
            value={stats.byStatus.review || 0}
            accent="text-yellow-400"
          />
        </div>
      )}

      {/* Filters */}
      <SignalFilters stats={stats} />

      {/* Bulk actions */}
      <BulkActions
        count={selected.size}
        onAction={handleBulkAction}
        onClear={() => setSelected(new Set())}
        loading={bulkLoading}
      />

      {/* Signal list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="text-slate-600 animate-spin" />
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500">No signals match your filters.</p>
          </div>
        ) : (
          signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              selected={selected.has(signal.id)}
              onSelect={handleSelect}
              onAction={handleAction}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
          <span className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} signals
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Rejection reason modal (single) */}
      {rejectModal && (
        <RejectModal
          onClose={() => setRejectModal(null)}
          onSubmit={(reason) => handleAction(rejectModal, 'reject', reason)}
        />
      )}

      {/* Rejection reason modal (bulk) */}
      {bulkRejectModal && (
        <RejectModal
          title={`Reject ${selected.size} signals`}
          onClose={() => setBulkRejectModal(false)}
          onSubmit={(reason) => handleBulkAction('reject', reason)}
        />
      )}

      <ToastContainer />
    </div>
  )
}

const REJECTION_REASONS = [
  'Product review / comparison',
  'Vendor marketing / PR',
  'Sponsored webinar / vendor event',
  'Listicle / best-of article',
  'Not cybersecurity relevant',
  'Duplicate content',
  'Low quality / no substance',
  'Sponsored / advertorial',
  'Generic best practices',
  'Career / hiring news',
  'Event / conference promo',
  'Other',
]

function RejectModal({
  onClose,
  onSubmit,
  title,
}: {
  onClose: () => void
  onSubmit: (reason: string) => void
  title?: string
}) {
  const [reason, setReason] = useState('')
  const [custom, setCustom] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">{title || 'Why reject this signal?'}</h2>
        <p className="text-xs text-slate-500 mb-4">This helps Carter learn your preferences and improve future scoring.</p>

        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {REJECTION_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-all ${
                reason === r
                  ? 'border-brand-500/50 bg-brand-500/10 text-brand-300'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {reason === 'Other' && (
          <input
            type="text"
            placeholder="Describe the reason..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="w-full px-3 py-2 mb-4 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSubmit(reason === 'Other' ? custom || 'Other' : reason)}
            disabled={!reason}
            className="flex-1 py-2.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 font-medium rounded-lg transition-all text-sm disabled:opacity-30"
          >
            Reject
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = 'text-brand-400',
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-5 hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-150">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
        {label}
      </div>
      <div className={`text-2xl font-semibold ${accent}`}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}
