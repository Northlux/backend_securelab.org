'use client'

import { Users, CreditCard, Lock, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCard {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendDirection?: 'up' | 'down'
}

export default function Home() {
  const stats: StatCard[] = [
    {
      label: 'Total Users',
      value: '1,234',
      icon: <Users size={20} />,
      trend: '+12%',
      trendDirection: 'up',
    },
    {
      label: 'Active Subscriptions',
      value: '856',
      icon: <CreditCard size={20} />,
      trend: '+8%',
      trendDirection: 'up',
    },
    {
      label: 'Pending Verifications',
      value: '42',
      icon: <AlertCircle size={20} />,
      trend: '-3%',
      trendDirection: 'down',
    },
    {
      label: 'Access Policies',
      value: '12',
      icon: <Lock size={20} />,
      trend: '+1',
      trendDirection: 'up',
    },
  ]

  return (
    <>
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-600 text-slate-100 mb-1">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your platform metrics and activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-150 group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="text-xs font-500 text-slate-400 uppercase tracking-wide">{stat.label}</div>
              <div className="text-slate-600 group-hover:text-slate-500 transition-colors opacity-70">
                {stat.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-600 text-slate-100">{stat.value}</div>
              {stat.trend && stat.trendDirection && (
                <div className="flex items-center gap-1">
                  {stat.trendDirection === 'up' ? (
                    <TrendingUp size={14} className="text-green-500" />
                  ) : (
                    <TrendingDown size={14} className="text-red-500" />
                  )}
                  <span
                    className={`text-xs font-600 ${
                      stat.trendDirection === 'up'
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-800 rounded-lg p-6 hover:bg-slate-800/60 transition-all duration-150">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-600 text-slate-100">Recent Users</h2>
              <p className="text-xs text-slate-500 mt-1">Latest signups and activity</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { email: 'user@example.com', status: 'active', date: '2 hours ago' },
              { email: 'admin@securelab.org', status: 'active', date: '1 day ago' },
              { email: 'dev@securelab.org', status: 'pending', date: '3 days ago' },
            ].map((user, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-slate-800/50 hover:border-slate-700/50 transition-all duration-150"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-600 flex-shrink-0">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-500 text-slate-200 truncate">{user.email}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user.date}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-500 flex-shrink-0 ml-3 ${
                    user.status === 'active'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-yellow-500/15 text-yellow-400'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 hover:bg-slate-800/60 transition-all duration-150">
          <div>
            <h2 className="text-sm font-600 text-slate-100">System Status</h2>
            <p className="text-xs text-slate-500 mt-1">Service health</p>
          </div>
          <div className="space-y-3 mt-6">
            {[
              { label: 'Database', status: 'online' },
              { label: 'Auth Service', status: 'online' },
              { label: 'API Endpoints', status: 'online' },
              { label: 'Cache', status: 'online' },
            ].map((service, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-sm text-slate-400">{service.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-slate-500 font-500">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
