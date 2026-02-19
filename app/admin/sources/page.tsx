/**
 * Source Management Page
 *
 * View, add, edit, enable/disable data feed sources.
 * Sources are the feeds (RSS, API, scraper, manual) that
 * the news_feeder pipeline ingests from.
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Search,
  RefreshCw,
  Radio,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  X,
  Rss,
  Globe,
  Code,
  FileText,
} from 'lucide-react'
import { showToast, ToastContainer } from '@/app/components/intel/toast'

interface Source {
  id: string
  name: string
  url: string
  source_type: string
  is_active: boolean
  priority: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  rss: <Rss size={14} />,
  api: <Code size={14} />,
  scraper: <Globe size={14} />,
  manual: <FileText size={14} />,
}

const TYPE_COLORS: Record<string, string> = {
  rss: 'bg-orange-500/15 text-orange-400',
  api: 'bg-blue-500/15 text-blue-400',
  scraper: 'bg-purple-500/15 text-purple-400',
  manual: 'bg-green-500/15 text-green-400',
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchSources = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (activeFilter) params.set('active', activeFilter)

      const res = await fetch(`/api/v1/admin/sources?${params.toString()}`)
      const json = await res.json()
      setSources(json.data || [])
    } catch {
      showToast('error', 'Failed to load sources')
    }
    setLoading(false)
  }, [search, typeFilter, activeFilter])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const toggleActive = async (source: Source) => {
    try {
      const res = await fetch(`/api/v1/admin/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !source.is_active }),
      })
      if (res.ok) {
        showToast('success', `${source.name} ${source.is_active ? 'disabled' : 'enabled'}`)
        fetchSources()
      }
    } catch {
      showToast('error', 'Failed to update source')
    }
  }

  const deleteSource = async (source: Source) => {
    if (!confirm(`Delete "${source.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/v1/admin/sources/${source.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('success', `${source.name} deleted`)
        fetchSources()
      }
    } catch {
      showToast('error', 'Failed to delete source')
    }
  }

  const addSource = async (data: { name: string; url: string; source_type: string }) => {
    try {
      const res = await fetch('/api/v1/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        showToast('success', `${data.name} added`)
        setShowAddModal(false)
        fetchSources()
      } else {
        const json = await res.json()
        showToast('error', json.error || 'Failed to add source')
      }
    } catch {
      showToast('error', 'Network error')
    }
  }

  // Stats
  const activeCount = sources.filter((s) => s.is_active).length
  const types = [...new Set(sources.map((s) => s.source_type))]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Source Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            {sources.length} sources · {activeCount} active
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-all"
        >
          <Plus size={16} />
          Add Source
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSources()}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
        >
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Source list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="text-slate-600 animate-spin" />
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-16">
            <Radio size={32} className="text-slate-700 mx-auto mb-4" />
            <p className="text-sm text-slate-500">No sources found.</p>
          </div>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className={`group flex items-center gap-4 p-4 bg-slate-800/40 border rounded-lg transition-all duration-150 hover:bg-slate-800/60 ${
                source.is_active
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/50 opacity-60'
              }`}
            >
              {/* Type icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${TYPE_COLORS[source.source_type] || 'bg-slate-500/15 text-slate-400'}`}>
                {TYPE_ICONS[source.source_type] || <Globe size={14} />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {source.name}
                  </span>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${TYPE_COLORS[source.source_type] || 'bg-slate-500/15 text-slate-400'}`}>
                    {source.source_type}
                  </span>
                  {!source.is_active && (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-red-500/15 text-red-400">
                      disabled
                    </span>
                  )}
                </div>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-600 hover:text-brand-400 truncate block mt-0.5 transition-colors"
                  >
                    {source.url}
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleActive(source)}
                  className={`p-2 rounded-md transition-all ${
                    source.is_active
                      ? 'text-yellow-500 hover:bg-yellow-500/10'
                      : 'text-green-500 hover:bg-green-500/10'
                  }`}
                  title={source.is_active ? 'Disable' : 'Enable'}
                >
                  {source.is_active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                    title="Open URL"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => deleteSource(source)}
                  className="p-2 rounded-md text-red-500 hover:bg-red-500/10 transition-all"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add source modal */}
      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onSubmit={addSource}
        />
      )}

      <ToastContainer />
    </>
  )
}

// --- Add Source Modal ---

function AddSourceModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: { name: string; url: string; source_type: string }) => void
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [sourceType, setSourceType] = useState('rss')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), url: url.trim(), source_type: sourceType })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-100">Add Source</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BleepingComputer"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="rss">RSS Feed</option>
              <option value="api">API</option>
              <option value="scraper">Web Scraper</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-all text-sm"
            >
              Add Source
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
