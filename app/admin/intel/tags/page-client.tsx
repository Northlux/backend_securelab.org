'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from '@/app/actions/intel/tags'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagsClientProps {
  initialTags: Tag[]
}

export default function TagsClient({ initialTags }: TagsClientProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    setError(null)

    try {
      if (editingId) {
        await updateTag(editingId, {
          name: formData.name,
          color: formData.color,
        })
      } else {
        await createTag({
          name: formData.name,
          color: formData.color,
        })
      }
      const updated = await getTags()
      setTags(updated)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this tag?')) {
      setLoading(true)
      setError(null)
      try {
        await deleteTag(id)
        const updated = await getTags()
        setTags(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setFormData({
      name: tag.name,
      color: tag.color,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setShowForm(false)
    setFormData({
      name: '',
      color: '#3b82f6',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Tags</h1>
          <p className="text-sm text-slate-400 mt-1">Organize signals with tags for better categorization</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={18} />
          Add Tag
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
            {editingId ? 'Edit Tag' : 'Add New Tag'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Tag name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              required
              disabled={loading}
            />
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm text-slate-300 block mb-2">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer border border-slate-600"
                  disabled={loading}
                />
              </div>
              <div className="mt-6">
                <span className="inline-block px-3 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: formData.color }}>
                  Preview
                </span>
              </div>
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
        {tags.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No tags configured</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Color</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-100">{tag.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-slate-600"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-xs text-slate-400">{tag.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(tag)}
                          disabled={loading}
                          className="p-1 text-slate-400 hover:text-brand-400 disabled:opacity-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
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
          </div>
        )}
      </div>
    </div>
  )
}
