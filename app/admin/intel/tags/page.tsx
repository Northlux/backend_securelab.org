'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Edit2, Trash2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Tag {
  id: string
  name: string
  color: string
  usage_count?: number
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
  })

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (!error && data) {
      setTags(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) return

    if (editingId) {
      const { error } = await supabase
        .from('tags')
        .update(formData)
        .eq('id', editingId)

      if (!error) {
        fetchTags()
        resetForm()
      }
    } else {
      const { error } = await supabase
        .from('tags')
        .insert([formData])

      if (!error) {
        fetchTags()
        resetForm()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this tag?')) {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchTags()
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
          <h1 className="text-3xl font-bold text-slate-100">Signal Tags</h1>
          <p className="text-sm text-slate-400 mt-1">Organize signals with custom tags</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus size={18} />
          Add Tag
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            {editingId ? 'Edit Tag' : 'Add New Tag'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm text-slate-300 mb-2">Tag Name</label>
                <input
                  type="text"
                  placeholder="e.g., SQL Injection, RCE, Zero-Day"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-700 text-slate-100 rounded hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-6 text-center text-slate-400">Loading tags...</div>
        ) : tags.length === 0 ? (
          <div className="col-span-full p-6 text-center text-slate-400">No tags yet. Create one to get started.</div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-slate-100">{tag.name}</h3>
                    <p className="text-xs text-slate-400">{tag.color}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-700">
                <button
                  onClick={() => handleEdit(tag)}
                  className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors rounded hover:bg-slate-700/50"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-slate-700/50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
