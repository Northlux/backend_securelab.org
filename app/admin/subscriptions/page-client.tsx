'use client'

import { useState, useCallback } from 'react'
import { Search, ChevronDown, Eye, Edit, AlertCircle, Loader, DollarSign } from 'lucide-react'
import { getSubscriptions, type SubscriptionListResponse } from '@/app/actions/subscriptions'

interface FilterState {
  search: string
  status: string
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'expired', label: 'Expired' },
]

const statusBadgeColor = {
  active: 'bg-green-500/20 text-green-300 border border-green-500/30',
  canceled: 'bg-red-500/20 text-red-300 border border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
} as const

export default function SubscriptionPageClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subs, setSubs] = useState<SubscriptionListResponse | null>(null)
  const [filters, setFilters] = useState<FilterState>({ search: '', status: '' })
  const [page, setPage] = useState(1)

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getSubscriptions(page, 20, {
        status: filters.status || undefined,
        search: filters.search || undefined,
      })
      setSubs(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions')
    } finally {
      setIsLoading(false)
    }
  }, [page, filters])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const totalPages = subs ? Math.ceil(subs.total / subs.pageSize) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-300 mb-2">Search by email</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 pl-9 text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="appearance-none bg-slate-700 border border-slate-600 rounded-md px-3 py-2 pr-8 text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
        </div>

        <button
          onClick={loadSubscriptions}
          disabled={isLoading}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader size={16} className="animate-spin" /> : 'Load'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-200">Error</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-700/50 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader size={24} className="text-brand-600 animate-spin" />
          </div>
        ) : !subs || subs.subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <AlertCircle size={32} className="mb-2 opacity-50" />
            <p>No subscriptions found.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1fr_140px_120px_120px_120px_100px] gap-4 p-4 bg-slate-900/50 border-b border-slate-700/50">
              <div className="font-medium text-slate-300 text-sm">User Email</div>
              <div className="font-medium text-slate-300 text-sm">Tier</div>
              <div className="font-medium text-slate-300 text-sm">Price</div>
              <div className="font-medium text-slate-300 text-sm">Status</div>
              <div className="font-medium text-slate-300 text-sm">Ends</div>
              <div className="font-medium text-slate-300 text-sm">Actions</div>
            </div>

            <div className="divide-y divide-slate-700/50">
              {subs.subscriptions.map((sub: any) => (
                <div key={sub.id} className="grid grid-cols-[1fr_140px_120px_120px_120px_100px] gap-4 p-4 items-center hover:bg-slate-800/30">
                  <div className="truncate">
                    <p className="text-sm text-slate-100 font-medium">{sub.user_email}</p>
                  </div>
                  <span className="text-sm text-slate-300">{sub.tier_name}</span>
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} />
                    <span className="text-sm text-slate-300">{sub.price}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium text-center ${statusBadgeColor[sub.status as keyof typeof statusBadgeColor] || 'bg-slate-700'}`}>
                    {sub.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(sub.current_period_end).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200">
                      <Eye size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200">
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-700/50 bg-slate-900/25">
              <div className="text-xs text-slate-400">
                Showing {subs.subscriptions.length} of {subs.total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
