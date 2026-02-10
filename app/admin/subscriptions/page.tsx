'use client'

import { useState } from 'react'
import { Calendar, DollarSign, Trash2 } from 'lucide-react'

interface Subscription {
  id: string
  user_email: string
  tier: 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'pending'
  price: number
  start_date: string
  end_date: string | null
  features: string[]
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    user_email: 'admin@securelab.org',
    tier: 'enterprise',
    status: 'active',
    price: 9999,
    start_date: '2026-01-01T00:00:00Z',
    end_date: '2027-01-01T00:00:00Z',
    features: ['Unlimited signals', 'API access', 'Custom integrations', '24/7 support'],
  },
  {
    id: '2',
    user_email: 'analyst@securelab.org',
    tier: 'pro',
    status: 'active',
    price: 4999,
    start_date: '2026-01-15T00:00:00Z',
    end_date: '2027-01-15T00:00:00Z',
    features: ['10K signals/month', 'Email support', 'Custom dashboards'],
  },
  {
    id: '3',
    user_email: 'viewer@securelab.org',
    tier: 'basic',
    status: 'active',
    price: 0,
    start_date: '2026-02-01T00:00:00Z',
    end_date: null,
    features: ['1K signals/month', 'Community support'],
  },
]

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.user_email.toLowerCase().includes(search.toLowerCase()) ||
      sub.tier.toLowerCase().includes(search.toLowerCase())
  )

  const tierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-red-500/20 text-red-300'
      case 'pro':
        return 'bg-blue-500/20 text-blue-300'
      case 'basic':
        return 'bg-slate-500/20 text-slate-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300'
      case 'cancelled':
        return 'bg-red-500/20 text-red-300'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free'
    return `$${(price / 100).toFixed(2)}/month`
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this subscription? This cannot be undone.')) return

    setLoading(true)
    try {
      setSubscriptions(
        subscriptions.map((sub) =>
          sub.id === id ? { ...sub, status: 'cancelled' as const } : sub
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Subscriptions</h1>
        <p className="text-sm text-slate-400 mt-1">Manage user subscriptions and billing</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <input
          type="text"
          placeholder="Search by email or tier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {filteredSubscriptions.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No subscriptions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Tier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Start Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">End Date</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-100">{sub.user_email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${tierColor(sub.tier)}`}>
                        {sub.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 flex items-center gap-1">
                      <DollarSign size={14} />
                      {formatPrice(sub.price)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${statusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(sub.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          disabled={loading || sub.status !== 'active'}
                          onClick={() => handleCancel(sub.id)}
                          className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-50 transition-colors"
                          title="Cancel subscription"
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
