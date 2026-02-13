'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import {
  getSources,
  createSource,
  updateSource,
  deleteSource,
  toggleSourceStatus,
} from '@/app/actions/intel/sources'

interface Source {
  id: string
  name: string
  source_type: string
  url: string | null
  is_active: boolean
  update_frequency: string
  priority: number
}

interface SourcesClientProps {
  initialSources: Source[]
}

export default function SourcesClient({ initialSources }: SourcesClientProps) {
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    source_type: 'rss',
    url: '',
    update_frequency: 'hourly',
    priority: 50,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (editingId) {
        await updateSource(editingId, {
          name: formData.name,
          source_type: formData.source_type as 'rss' | 'api' | 'web' | 'database' | 'manual',
          url: formData.url || null,
          update_frequency: formData.update_frequency as 'daily' | 'hourly' | 'monthly' | 'manual' | 'weekly',
          priority: formData.priority,
          is_active: true,
        })
      } else {
        await createSource({
          name: formData.name,
          source_type: formData.source_type as 'rss' | 'api' | 'web' | 'database' | 'manual',
          url: formData.url || null,
          update_frequency: formData.update_frequency as 'daily' | 'hourly' | 'monthly' | 'manual' | 'weekly',
          priority: formData.priority,
          is_active: true,
        })
      }
      const updated = await getSources()
      setSources(updated)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this source?')) {
      setLoading(true)
      setError(null)
      try {
        await deleteSource(id)
        const updated = await getSources()
        setSources(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    setLoading(true)
    setError(null)
    try {
      await toggleSourceStatus(id, isActive)
      const updated = await getSources()
      setSources(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (source: Source) => {
    setEditingId(source.id)
    setFormData({
      name: source.name,
      source_type: source.source_type,
      url: source.url || '',
      update_frequency: source.update_frequency,
      priority: source.priority,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setShowForm(false)
    setFormData({
      name: '',
      source_type: 'rss',
      url: '',
      update_frequency: 'hourly',
      priority: 50,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Intel Sources</h1>
          <p className="text-sm text-slate-400 mt-1">Manage threat intelligence data sources</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={18} />
          Add Source
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            {editingId ? 'Edit Source' : 'Add New Source'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                required
                disabled={loading}
              />
              <select
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none"
                disabled={loading}
              >
                <option value="rss">RSS Feed</option>
                <option value="api">API</option>
                <option value="scraper">Scraper</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <input
              type="url"
              placeholder="Source URL (optional)"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              disabled={loading}
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.update_frequency}
                onChange={(e) => setFormData({ ...formData, update_frequency: e.target.value })}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none"
                disabled={loading}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual</option>
              </select>
              <input
                type="number"
                placeholder="Priority (1-100)"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                min="1"
                max="100"
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="px-4 py-2 bg-slate-700 text-slate-100 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {sources.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No sources configured</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Frequency</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Priority</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sources.map((source) => (
                <tr key={source.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-100">{source.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-brand-500/20 text-brand-300 rounded text-xs font-medium">
                      {source.source_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{source.update_frequency}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{source.priority}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleToggle(source.id, source.is_active)}
                      disabled={loading}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                        source.is_active
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      }`}
                    >
                      {source.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(source)}
                        disabled={loading}
                        className="p-1 text-slate-400 hover:text-brand-400 disabled:opacity-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        disabled={loading}
                        className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-50 transition-colors"
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
        )}
      </div>
    </div>
  )
}
