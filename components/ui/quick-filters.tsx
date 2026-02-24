'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

const CATEGORY_FILTERS = [
  { value: 'vulnerability', label: 'Vulnerability', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  { value: 'breach', label: 'Breach', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  { value: 'malware', label: 'Malware', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { value: 'ransomware', label: 'Ransomware', color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
  { value: 'exploit', label: 'Exploit', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  { value: 'apt', label: 'APT', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  { value: 'phishing', label: 'Phishing', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
]

const SEVERITY_FILTERS = [
  { value: 'critical', label: 'Critical', color: 'bg-red-600/20 text-red-300 border-red-600/40' },
  { value: 'high', label: 'High', color: 'bg-orange-600/20 text-orange-300 border-orange-600/40' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/40' },
  { value: 'low', label: 'Low', color: 'bg-green-600/20 text-green-300 border-green-600/40' },
]

interface QuickFiltersProps {
  stats?: {
    byCategory: Record<string, number>
    bySeverity: Record<string, number>
  } | null
}

export function QuickFilters({ stats }: QuickFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentCategory = searchParams.get('category')
  const currentSeverity = searchParams.get('severity')
  
  const hasActiveFilters = currentCategory || currentSeverity
  
  const setFilter = (type: 'category' | 'severity', value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Toggle filter - if clicking active filter, clear it
    if (type === 'category' && currentCategory === value) {
      params.delete('category')
    } else if (type === 'severity' && currentSeverity === value) {
      params.delete('severity')
    } else {
      params.set(type, value)
    }
    
    // Reset to page 1 when filtering
    params.set('page', '1')
    
    router.push(`/admin/intel?${params.toString()}`)
  }
  
  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('severity')
    params.set('page', '1')
    router.push(`/admin/intel?${params.toString()}`)
  }
  
  return (
    <div className="space-y-3">
      {/* Category Filters */}
      <div>
        <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
          Category
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => {
            const count = stats?.byCategory[filter.value] || 0
            const isActive = currentCategory === filter.value
            
            return (
              <button
                key={filter.value}
                onClick={() => setFilter('category', filter.value)}
                disabled={count === 0}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${isActive 
                    ? `${filter.color} ring-2 ring-brand-500/30 scale-105` 
                    : count > 0
                      ? `${filter.color} hover:scale-105 hover:ring-2 hover:ring-brand-500/20`
                      : 'bg-slate-800/30 text-slate-600 border-slate-800 cursor-not-allowed'
                  }
                `}
              >
                {filter.label}
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-black/20 rounded text-xs">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Severity Filters */}
      <div>
        <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
          Severity
        </div>
        <div className="flex flex-wrap gap-2">
          {SEVERITY_FILTERS.map((filter) => {
            const count = stats?.bySeverity[filter.value] || 0
            const isActive = currentSeverity === filter.value
            
            return (
              <button
                key={filter.value}
                onClick={() => setFilter('severity', filter.value)}
                disabled={count === 0}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${isActive 
                    ? `${filter.color} ring-2 ring-brand-500/30 scale-105` 
                    : count > 0
                      ? `${filter.color} hover:scale-105 hover:ring-2 hover:ring-brand-500/20`
                      : 'bg-slate-800/30 text-slate-600 border-slate-800 cursor-not-allowed'
                  }
                `}
              >
                {filter.label}
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-black/20 rounded text-xs">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="pt-1">
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
          >
            <X size={12} />
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
