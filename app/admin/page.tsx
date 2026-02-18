/**
 * Admin Dashboard — real-time platform overview
 *
 * Displays live stats from Supabase: signal counts, triage status,
 * source health, ingestion activity, and pipeline throughput.
 *
 * Data fetched from: GET /api/v1/admin/dashboard
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Radio,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Database,
  Activity,
  RefreshCw,
} from 'lucide-react'

interface DashboardData {
  signals: {
    total: number
    last24h: number
    last7d: number
    byCategory: Record<string, number>
    bySeverity: Record<string, number>
  }
  triage: {
    approved: number
    rejected: number
    review: number
    pending: number
    total: number
  }
  sources: {
    total: number
    active: number
    inactive: number
    byType: Record<string, number>
  }
  ingestion: {
    recentLogs: Array<{
      id: string
      source_id: string
      status: string
      signals_imported: number
      signals_skipped: number
      error_message: string
      created_at: string
    }>
  }
  pipeline: {
    lastSignalAt: string | null
    signalsPerDay: Record<string, number>
  }
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  info: 'bg-blue-500',
}

const CATEGORY_COLORS: Record<string, string> = {
  vulnerability: 'text-red-400',
  breach: 'text-orange-400',
  malware: 'text-purple-400',
  exploit: 'text-yellow-400',
  ransomware: 'text-pink-400',
  apt: 'text-cyan-400',
  phishing: 'text-green-400',
  news: 'text-blue-400',
  research: 'text-violet-400',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/v1/admin/dashboard')
      const json = await res.json()
      setData(json)
    } catch {
      // silent fail, keep showing stale data
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 60s
    const interval = setInterval(() => fetchData(), 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="text-slate-600 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={32} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-500">Failed to load dashboard data.</p>
      </div>
    )
  }

  // Top categories sorted by count
  const topCategories = Object.entries(data.signals.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  // Signals per day for sparkline (last 7 days)
  const days = Object.entries(data.pipeline.signalsPerDay)
    .sort(([a], [b]) => a.localeCompare(b))
  const maxPerDay = Math.max(...days.map(([, v]) => v), 1)

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-600 text-slate-100 mb-1">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Real-time platform overview
            {data.pipeline.lastSignalAt && (
              <span className="ml-2 text-slate-600">
                · Last signal {timeAgo(data.pipeline.lastSignalAt)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-xs font-500 text-slate-400 hover:text-slate-200 bg-slate-800/40 border border-slate-800 rounded-lg hover:border-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard
          label="Total Signals"
          value={data.signals.total.toLocaleString()}
          icon={<Database size={20} />}
          detail={`+${data.signals.last24h} last 24h`}
          detailColor={data.signals.last24h > 0 ? 'text-green-400' : 'text-slate-600'}
        />
        <StatCard
          label="Pending Review"
          value={(data.triage.pending + data.triage.review).toLocaleString()}
          icon={<Clock size={20} />}
          detail={`${data.triage.review} flagged for review`}
          detailColor="text-yellow-400"
          href="/admin/intel?status=pending"
        />
        <StatCard
          label="Approved"
          value={data.triage.approved.toLocaleString()}
          icon={<CheckCircle size={20} />}
          detail={`${data.triage.rejected} rejected`}
          detailColor="text-green-400"
          href="/admin/intel?status=approved"
        />
        <StatCard
          label="Active Sources"
          value={data.sources.active.toLocaleString()}
          icon={<Radio size={20} />}
          detail={`${data.sources.total} total · ${data.sources.inactive} inactive`}
          detailColor="text-slate-500"
          href="/admin/sources"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        {/* Signal volume (last 7 days) */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-800 rounded-lg p-6 hover:bg-slate-800/60 transition-all duration-150">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-600 text-slate-100">Signal Volume</h2>
              <p className="text-xs text-slate-500 mt-1">Last 7 days · {data.signals.last7d} signals</p>
            </div>
            <TrendingUp size={16} className="text-slate-600" />
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-2 h-32">
            {days.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-slate-500">{count}</span>
                <div
                  className="w-full bg-brand-500/30 rounded-t transition-all duration-300 hover:bg-brand-500/50"
                  style={{ height: `${(count / maxPerDay) * 100}%`, minHeight: '4px' }}
                />
                <span className="text-xs text-slate-600">
                  {new Date(day).toLocaleDateString('en-GB', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Severity distribution */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 hover:bg-slate-800/60 transition-all duration-150">
          <h2 className="text-sm font-600 text-slate-100 mb-6">Severity Distribution</h2>
          <div className="space-y-3">
            {Object.entries(data.signals.bySeverity)
              .sort(([, a], [, b]) => b - a)
              .map(([sev, count]) => {
                const pct = Math.round((count / data.signals.total) * 100)
                return (
                  <div key={sev} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-500 text-slate-400 capitalize">{sev}</span>
                      <span className="text-xs text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${SEVERITY_COLORS[sev] || 'bg-slate-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top categories */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 hover:bg-slate-800/60 transition-all duration-150">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-600 text-slate-100">Top Categories</h2>
              <p className="text-xs text-slate-500 mt-1">{Object.keys(data.signals.byCategory).length} categories tracked</p>
            </div>
            <Link
              href="/admin/intel"
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {topCategories.map(([cat, count]) => (
              <div
                key={cat}
                className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-800/50 hover:border-slate-700/50 transition-all duration-150"
              >
                <span className={`text-sm font-500 ${CATEGORY_COLORS[cat] || 'text-slate-300'}`}>
                  {cat.replace('_', ' ')}
                </span>
                <span className="text-sm font-600 text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline status */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 hover:bg-slate-800/60 transition-all duration-150">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-600 text-slate-100">Pipeline Status</h2>
              <p className="text-xs text-slate-500 mt-1">Triage & source health</p>
            </div>
            <Activity size={16} className="text-slate-600" />
          </div>

          {/* Triage funnel */}
          <div className="space-y-3 mb-6">
            <div className="text-xs font-500 text-slate-500 uppercase tracking-wide">Triage Funnel</div>
            <div className="grid grid-cols-4 gap-2">
              <FunnelCard label="Pending" value={data.triage.pending} color="text-slate-400" />
              <FunnelCard label="Review" value={data.triage.review} color="text-yellow-400" />
              <FunnelCard label="Approved" value={data.triage.approved} color="text-green-400" />
              <FunnelCard label="Rejected" value={data.triage.rejected} color="text-red-400" />
            </div>
          </div>

          {/* Source types */}
          <div className="space-y-3">
            <div className="text-xs font-500 text-slate-500 uppercase tracking-wide">Source Types</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.sources.byType).map(([type, count]) => (
                <span
                  key={type}
                  className="px-2.5 py-1 text-xs bg-slate-900/60 border border-slate-800/50 rounded text-slate-400"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* System health */}
          <div className="mt-6 space-y-3">
            <div className="text-xs font-500 text-slate-500 uppercase tracking-wide">System</div>
            <div className="space-y-2">
              <HealthRow label="Database" status="online" />
              <HealthRow label="Scrapers" status={data.signals.last24h > 0 ? 'online' : 'idle'} />
              <HealthRow label="Triage Pipeline" status={data.triage.total > 0 ? 'online' : 'idle'} />
              <HealthRow
                label="Sources"
                status={data.sources.inactive > 10 ? 'warning' : 'online'}
                detail={`${data.sources.inactive} inactive`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// --- Sub-components ---

function StatCard({
  label,
  value,
  icon,
  detail,
  detailColor = 'text-slate-500',
  href,
}: {
  label: string
  value: string
  icon: React.ReactNode
  detail?: string
  detailColor?: string
  href?: string
}) {
  const inner = (
    <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-150 group">
      <div className="flex items-start justify-between mb-6">
        <div className="text-xs font-500 text-slate-400 uppercase tracking-wide">{label}</div>
        <div className="text-slate-600 group-hover:text-slate-500 transition-colors opacity-70">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-600 text-slate-100">{value}</div>
      </div>
      {detail && (
        <div className={`text-xs mt-2 ${detailColor}`}>{detail}</div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }
  return inner
}

function FunnelCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-3 bg-slate-900/40 rounded-lg border border-slate-800/50">
      <div className={`text-lg font-600 ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

function HealthRow({
  label,
  status,
  detail,
}: {
  label: string
  status: 'online' | 'idle' | 'warning' | 'offline'
  detail?: string
}) {
  const dotColor = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    warning: 'bg-orange-500',
    offline: 'bg-red-500',
  }[status]

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs text-slate-600">{detail}</span>}
        <div className={`w-2 h-2 rounded-full ${dotColor} ${status === 'online' ? 'animate-pulse' : ''}`} />
        <span className="text-xs text-slate-500 font-500">{status}</span>
      </div>
    </div>
  )
}
