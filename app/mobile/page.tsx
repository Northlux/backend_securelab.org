'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Filter,
  X,
  CheckSquare,
  Square,
} from 'lucide-react'

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

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const CATEGORY_COLORS: Record<string, string> = {
  vulnerability: 'text-red-400',
  breach: 'text-orange-400',
  malware: 'text-purple-400',
  ransomware: 'text-pink-400',
  exploit: 'text-yellow-400',
  apt: 'text-cyan-400',
  news: 'text-blue-400',
  research: 'text-violet-400',
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
  'Other',
]

function getTriage(signal: Signal): TriageResult | null {
  const tr = signal.triage_results
  if (!tr) return null
  if (Array.isArray(tr)) return tr[0] || null
  return tr
}

function getStatus(signal: Signal): string {
  return getTriage(signal)?.triage_status || 'pending'
}

function formatDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function ScorePill({ label, score }: { label: string; score: number | null }) {
  if (score === null || score === undefined || score < 0) return null
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {label}{score}
    </span>
  )
}

export default function MobileTriage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<string>('pending')
  const [showFilters, setShowFilters] = useState(false)
  const [acting, setActing] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null) // single signal id or 'bulk'
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [bulkActing, setBulkActing] = useState(false)

  const showToast = (type: string, msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchSignals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter && filter !== 'all') params.set('status', filter)
      params.set('page', page.toString())
      params.set('limit', '15')
      const res = await fetch(`/api/v1/admin/signals?${params}`)
      const json = await res.json()
      setSignals(json.data || [])
      setTotalPages(json.pagination?.totalPages || 1)
      setTotal(json.pagination?.total || 0)
    } catch {
      showToast('error', 'Failed to load')
    }
    setLoading(false)
    setSelected(new Set())
  }, [filter, page])

  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  const handleApprove = async (id: string) => {
    setActing(id)
    try {
      const res = await fetch(`/api/v1/admin/signals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triage_status: 'approved' }),
      })
      if (res.ok) {
        showToast('success', 'Approved')
        setSignals(prev => prev.filter(s => s.id !== id))
      } else {
        showToast('error', 'Failed')
      }
    } catch {
      showToast('error', 'Network error')
    }
    setActing(null)
  }

  const handleReject = async (id: string, reason: string) => {
    setActing(id)
    try {
      const res = await fetch(`/api/v1/admin/signals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triage_status: 'rejected', rejection_reason: reason }),
      })
      if (res.ok) {
        showToast('success', 'Rejected')
        setRejectTarget(null)
        setSignals(prev => prev.filter(s => s.id !== id))
      } else {
        showToast('error', 'Failed')
      }
    } catch {
      showToast('error', 'Network error')
    }
    setActing(null)
  }

  const handleBulkAction = async (action: 'approve' | 'reject', reason?: string) => {
    if (selected.size === 0) return
    setBulkActing(true)
    try {
      const body: Record<string, unknown> = {
        action,
        ids: Array.from(selected),
      }
      if (reason) body.rejection_reason = reason

      const res = await fetch('/api/v1/admin/signals/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        showToast('success', `${json.updated} signals ${action}d`)
        setSignals(prev => prev.filter(s => !selected.has(s.id)))
        setSelected(new Set())
        setSelectMode(false)
        setRejectTarget(null)
      } else {
        showToast('error', json.errors?.[0] || 'Failed')
      }
    } catch {
      showToast('error', 'Network error')
    }
    setBulkActing(false)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === signals.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(signals.map(s => s.id)))
    }
  }

  const statusCounts: Record<string, string> = {
    all: 'All',
    pending: 'Pending',
    review: 'Review',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  const allSelected = signals.length > 0 && selected.size === signals.length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100">🛡️ SecureLab</h1>
            <p className="text-xs text-slate-500">{total} signals · Page {page}/{totalPages}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectMode(!selectMode); setSelected(new Set()) }}
              className={`p-2 rounded-lg border transition-all ${
                selectMode
                  ? 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
              }`}
            >
              <CheckSquare size={18} />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-all ${
                showFilters
                  ? 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
              }`}
            >
              <Filter size={18} />
            </button>
            <button
              onClick={() => { setPage(1); fetchSignals() }}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            {Object.entries(statusCounts).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setPage(1); setShowFilters(false) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  filter === key
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Select mode bar */}
        {selectMode && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 border border-slate-700/50 text-slate-300 active:bg-slate-700/50"
            >
              {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            {selected.size > 0 && (
              <>
                <span className="text-xs text-slate-500">{selected.size} selected</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    disabled={bulkActing}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30 active:bg-green-500/25 disabled:opacity-30"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setRejectTarget('bulk')}
                    disabled={bulkActing}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 active:bg-red-500/25 disabled:opacity-30"
                  >
                    ✗ Reject
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Signal list */}
      <div className="px-3 py-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="text-slate-600 animate-spin" />
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            No signals to review 🎉
          </div>
        ) : (
          signals.map((signal) => {
            const triage = getTriage(signal)
            const status = getStatus(signal)
            const expanded = expandedId === signal.id
            const isActing = acting === signal.id
            const isSelected = selected.has(signal.id)

            return (
              <div
                key={signal.id}
                className={`bg-slate-900/80 border rounded-xl overflow-hidden transition-all ${
                  isSelected
                    ? 'border-brand-500/50 bg-brand-500/5'
                    : 'border-slate-800/60'
                }`}
              >
                {/* Card content */}
                <button
                  className="w-full text-left px-4 py-3 active:bg-slate-800/40 transition-colors"
                  onClick={() => {
                    if (selectMode) {
                      toggleSelect(signal.id)
                    } else {
                      setExpandedId(expanded ? null : signal.id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox in select mode */}
                    {selectMode && (
                      <div className="pt-0.5 flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare size={20} className="text-brand-400" />
                        ) : (
                          <Square size={20} className="text-slate-600" />
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <p className="text-sm font-semibold text-slate-100 leading-snug mb-1.5">
                        {signal.title}
                      </p>

                      {/* Tags row */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${SEVERITY_COLORS[signal.severity] || ''}`}>
                          {signal.severity}
                        </span>
                        <span className={`text-[10px] font-medium ${CATEGORY_COLORS[signal.signal_category] || 'text-slate-400'}`}>
                          {signal.signal_category}
                        </span>
                        {triage && (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <ScorePill label="K" score={triage.kimi_score} />
                            <ScorePill label="O" score={triage.openai_score} />
                          </div>
                        )}
                      </div>

                      {/* Date + status */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600">
                          {formatDate(signal.source_date || signal.created_at)}
                        </span>
                        {status !== 'pending' && (
                          <span className={`text-[10px] font-medium ${
                            status === 'approved' ? 'text-green-400' :
                            status === 'rejected' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {expanded && !selectMode && (
                  <div className="px-4 pb-3 space-y-2 border-t border-slate-800/40">
                    {signal.summary && (
                      <p className="text-xs text-slate-400 leading-relaxed pt-2">
                        {signal.summary.slice(0, 300)}
                        {signal.summary.length > 300 && '…'}
                      </p>
                    )}

                    {triage?.polished_content && (
                      <div className="bg-slate-800/40 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 font-medium mb-1">AI POLISHED</p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {triage.polished_content.slice(0, 400)}
                          {triage.polished_content.length > 400 && '…'}
                        </p>
                      </div>
                    )}

                    {signal.source_url && (
                      <a
                        href={signal.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-brand-400 active:text-brand-300"
                      >
                        <ExternalLink size={12} />
                        Source
                      </a>
                    )}
                  </div>
                )}

                {/* Action buttons — only in non-select mode */}
                {!selectMode && (status === 'pending' || status === 'review') && (
                  <div className="flex border-t border-slate-800/40">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(signal.id) }}
                      disabled={isActing}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-green-400 active:bg-green-500/10 transition-colors disabled:opacity-30 border-r border-slate-800/40"
                    >
                      <CheckCircle size={20} />
                      <span className="text-sm font-semibold">Approve</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRejectTarget(signal.id) }}
                      disabled={isActing}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-red-400 active:bg-red-500/10 transition-colors disabled:opacity-30"
                    >
                      <XCircle size={20} />
                      <span className="text-sm font-semibold">Reject</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-slate-800/50 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 disabled:opacity-30 active:bg-slate-700/50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 disabled:opacity-30 active:bg-slate-700/50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Reject modal — works for single and bulk */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border-t border-slate-800 rounded-t-2xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-100">
                {rejectTarget === 'bulk'
                  ? `Reject ${selected.size} signals`
                  : 'Rejection reason'}
              </h2>
              <button
                onClick={() => setRejectTarget(null)}
                className="p-1.5 rounded-lg text-slate-500 active:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {REJECTION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    if (rejectTarget === 'bulk') {
                      handleBulkAction('reject', reason)
                    } else {
                      handleReject(rejectTarget, reason)
                    }
                  }}
                  disabled={bulkActing || acting !== null}
                  className="w-full text-left px-4 py-3 text-sm rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 active:bg-red-500/10 active:border-red-500/30 active:text-red-400 transition-all disabled:opacity-30"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium text-center ${
          toast.type === 'success'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
