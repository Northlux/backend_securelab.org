'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Edit2, Users } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SubscriptionTier {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number | null
  price_yearly: number | null
  app_access: string[]
  features: string[]
  is_active: boolean
  user_count?: number
}

export default function TiersPage() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<SubscriptionTier>>({})

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = async () => {
    setLoading(true)

    // Get all tiers with user count
    const { data: tiers } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('price_monthly', { ascending: true, nullsFirst: true })

    // Get user counts per tier
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('tier_id')

    if (tiers) {
      const tierCounts = new Map()
      subscriptions?.forEach((sub: any) => {
        tierCounts.set(sub.tier_id, (tierCounts.get(sub.tier_id) || 0) + 1)
      })

      setTiers(
        tiers.map((tier: any) => ({
          ...tier,
          user_count: tierCounts.get(tier.id) || 0,
        }))
      )
    }

    setLoading(false)
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('subscription_tiers')
      .update(editData)
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      setEditData({})
      fetchTiers()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Subscription Tiers</h1>
        <p className="text-sm text-slate-400 mt-1">Manage subscription plans and access levels</p>
      </div>

      {loading ? (
        <div className="p-6 text-center text-slate-400 bg-slate-800/50 border border-slate-700 rounded-lg">
          Loading tiers...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`border rounded-lg p-6 ${
                tier.is_active
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-slate-900/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">{tier.display_name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{tier.name}</p>
                </div>
                {tier.price_monthly && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-400">${tier.price_monthly}</p>
                    <p className="text-xs text-slate-400">/month</p>
                  </div>
                )}
              </div>

              {tier.description && (
                <p className="text-sm text-slate-400 mb-4">{tier.description}</p>
              )}

              <div className="space-y-3 mb-4 pb-4 border-b border-slate-700">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-slate-400" />
                  <span className="text-slate-300">{tier.user_count} users</span>
                </div>

                {tier.app_access.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">App Access:</p>
                    <div className="flex flex-wrap gap-1">
                      {tier.app_access.map((app) => (
                        <span
                          key={app}
                          className="px-2 py-0.5 bg-brand-500/20 text-brand-300 rounded text-xs font-medium"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tier.features.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Features:</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <span className="text-brand-400">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {editingId === tier.id ? (
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Monthly Price"
                    value={editData.price_monthly || tier.price_monthly || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, price_monthly: parseFloat(e.target.value) || null })
                    }
                    className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(tier.id)}
                      className="flex-1 px-3 py-1.5 text-sm bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setEditData({})
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-slate-700 text-slate-100 rounded hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(tier.id)
                    setEditData(tier)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 rounded transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
