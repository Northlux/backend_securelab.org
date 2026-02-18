'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search } from 'lucide-react'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'review', label: 'Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

const CATEGORIES = [
  'vulnerability',
  'breach',
  'malware',
  'exploit',
  'ransomware',
  'apt',
  'phishing',
  'news',
  'research',
  'supply_chain',
  'policy',
  'tool',
  'advisory',
]

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']

interface StatsData {
  byStatus: Record<string, number>
}

export function SignalFilters({ stats }: { stats: StatsData | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') || 'all'
  const currentCategory = searchParams.get('category') || ''
  const currentSeverity = searchParams.get('severity') || ''
  const currentSearch = searchParams.get('search') || ''

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // reset pagination on filter change
      router.push(`/admin/intel?${params.toString()}`)
    },
    [router, searchParams]
  )

  const statusCount = (key: string): number => {
    if (!stats) return 0
    if (key === 'all') {
      return Object.values(stats.byStatus).reduce((a, b) => a + b, 0)
    }
    return stats.byStatus[key] || 0
  }

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg p-1 border border-slate-800/50">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => updateParam('status', tab.key)}
            className={`px-4 py-2 rounded-md text-xs font-500 transition-all duration-150 ${
              currentStatus === tab.key
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
            {stats && (
              <span
                className={`ml-1.5 ${
                  currentStatus === tab.key ? 'text-brand-400' : 'text-slate-600'
                }`}
              >
                {statusCount(tab.key)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search signals..."
            defaultValue={currentSearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParam('search', (e.target as HTMLInputElement).value)
              }
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
          />
        </div>

        {/* Category */}
        <select
          value={currentCategory}
          onChange={(e) => updateParam('category', e.target.value)}
          className="px-3 py-2 text-xs bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace('_', ' ')}
            </option>
          ))}
        </select>

        {/* Severity */}
        <select
          value={currentSeverity}
          onChange={(e) => updateParam('severity', e.target.value)}
          className="px-3 py-2 text-xs bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
        >
          <option value="">All Severities</option>
          {SEVERITIES.map((sev) => (
            <option key={sev} value={sev}>
              {sev}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
