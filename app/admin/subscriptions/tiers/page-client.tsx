'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Edit, Trash2, AlertCircle, Loader, Check, Users } from 'lucide-react'
import { getSubscriptionTiers, createSubscriptionTier, updateSubscriptionTier, deleteSubscriptionTier, type SubscriptionTier } from '@/app/actions/subscriptions'

export default function TiersPageClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    price_monthly: 0,
    price_annual: 0,
    description: '',
    features: [''] as string[],
    display_order: 0,
  })

  const loadTiers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getSubscriptionTiers()
      setTiers(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tiers')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTiers()
  }, [loadTiers])

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }))
  }

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => {
      const newFeatures = [...prev.features]
      newFeatures[index] = value
      return { ...prev, features: newFeatures }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateSubscriptionTier(editingId, formData)
      } else {
        await createSubscriptionTier({ ...formData, is_active: true })
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: '',
        price_monthly: 0,
        price_annual: 0,
        description: '',
        features: [''],
        display_order: 0,
      })
      loadTiers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tier')
    }
  }

  const handleEdit = (tier: SubscriptionTier) => {
    setFormData({
      name: tier.name,
      price_monthly: tier.price_monthly,
      price_annual: tier.price_annual,
      description: tier.description,
      features: tier.features,
      display_order: tier.display_order,
    })
    setEditingId(tier.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tier?')) return
    try {
      await deleteSubscriptionTier(id)
      loadTiers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tier')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      price_monthly: 0,
      price_annual: 0,
      description: '',
      features: [''],
      display_order: 0,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader size={24} className="text-brand-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="self-start px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          New Tier
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700/50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-100">{editingId ? 'Edit' : 'New'} Subscription Tier</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tier Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Pro"
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Price</label>
              <input
                type="number"
                value={formData.price_monthly}
                onChange={e => setFormData(prev => ({ ...prev, price_monthly: parseFloat(e.target.value) }))}
                placeholder="0.00"
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Annual Price</label>
              <input
                type="number"
                value={formData.price_annual}
                onChange={e => setFormData(prev => ({ ...prev, price_annual: parseFloat(e.target.value) }))}
                placeholder="0.00"
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Display Order</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={e => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tier description..."
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Features</label>
            <div className="space-y-2">
              {formData.features.map((feature, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={e => handleFeatureChange(idx, e.target.value)}
                    placeholder="Feature name..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 placeholder-slate-400 focus:border-brand-500"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="px-2 py-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-sm text-brand-400 hover:text-brand-300"
              >
                + Add Feature
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-medium transition-colors"
            >
              Save Tier
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tier Cards */}
      {tiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <AlertCircle size={32} className="mb-2 opacity-50" />
          <p>No tiers found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(tier => (
            <div key={tier.id} className="border border-slate-700/50 rounded-lg p-6 bg-slate-900 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">{tier.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{tier.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(tier)}
                    className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tier.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-700/50 pt-4">
                <div>
                  <div className="text-3xl font-bold text-slate-100">${tier.price_monthly}</div>
                  <div className="text-xs text-slate-400">/month</div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <Users size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-300">{tier.user_count} users</span>
                </div>

                <ul className="space-y-2">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
