'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ChevronDown, ChevronUp } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface User {
  id: string
  email: string
  created_at: string
}

interface UserWithSubscription extends User {
  subscription?: {
    id: string
    status: string
    tier: {
      id: string
      name: string
      display_name: string
    }
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tiers, setTiers] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchTiers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)

    // Get all users from auth (this requires admin privileges)
    const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers()

    if (!error && authUsers) {
      // Fetch subscriptions for each user
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, id, status, tier:subscription_tiers(id, name, display_name)')

      const userMap = new Map(subscriptions?.map(s => [s.user_id, s]) || [])

      const usersWithSubs = authUsers.map(user => ({
        id: user.id,
        email: user.email || 'Unknown',
        created_at: user.created_at,
        subscription: userMap.get(user.id),
      }))

      setUsers(usersWithSubs)
    }
    setLoading(false)
  }

  const fetchTiers = async () => {
    const { data } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)

    if (data) {
      setTiers(data)
    }
  }

  const handleUpdateSubscription = async (userId: string, tierId: string) => {
    setUpdatingId(userId)

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          tier_id: tierId,
          status: 'active',
        },
        { onConflict: 'user_id' }
      )

    if (!error) {
      // Log to audit trail
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'subscription_changed',
        resource_type: 'subscription',
        app_name: 'admin',
        metadata: { new_tier: tierId },
      })

      fetchUsers()
    }
    setUpdatingId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">User Management</h1>
        <p className="text-sm text-slate-400 mt-1">Manage platform users and subscriptions</p>
      </div>

      <div className="text-sm text-slate-300 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        Total Users: <span className="font-semibold text-brand-400">{users.length}</span>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="p-6 text-center text-slate-400 bg-slate-800/50 border border-slate-700 rounded-lg">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-800/50 border border-slate-700 rounded-lg">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-700/30 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 truncate">{user.email}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {user.subscription ? (
                      <>
                        Tier: <span className="text-brand-400">{user.subscription.tier.display_name}</span>
                        {' '}
                        | Status: <span className={user.subscription.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                          {user.subscription.status}
                        </span>
                      </>
                    ) : (
                      <span className="text-yellow-400">No subscription</span>
                    )}
                  </p>
                </div>
                {expandedId === user.id ? (
                  <ChevronUp size={20} className="text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
                )}
              </button>

              {expandedId === user.id && (
                <div className="border-t border-slate-700 bg-slate-900/30 px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 mb-1">User ID</p>
                      <p className="text-slate-100 font-mono text-xs break-all">{user.id}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Created</p>
                      <p className="text-slate-100">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Change Subscription Tier</label>
                    <div className="flex gap-2">
                      <select
                        defaultValue={user.subscription?.tier?.id || ''}
                        onChange={(e) => handleUpdateSubscription(user.id, e.target.value)}
                        disabled={updatingId === user.id}
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:border-brand-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Select a tier...</option>
                        {tiers.map((tier) => (
                          <option key={tier.id} value={tier.id}>
                            {tier.display_name} ({tier.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {user.subscription && (
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Current Subscription ID</p>
                      <p className="text-xs font-mono text-slate-300 bg-slate-800/50 p-2 rounded break-all">
                        {user.subscription.id}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
