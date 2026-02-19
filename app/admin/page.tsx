/**
 * Admin Dashboard — real-time platform overview
 *
 * Displays live stats from Supabase: signal counts, triage status,
 * source health, ingestion activity, and pipeline throughput.
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 bg-slate-800" />
        <Skeleton className="h-4 w-64 bg-slate-800/60" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 bg-slate-800/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-64 bg-slate-800/40" />
        <Skeleton className="h-64 bg-slate-800/40" />
      </div>
    </div>
  )
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
    const interval = setInterval(() => fetchData(), 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <DashboardSkeleton />

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
          <AlertTriangle size={24} className="text-slate-500" />
        </div>
        <p className="text-slate-500">Failed to load dashboard data.</p>
        <Button variant="outline" onClick={() => fetchData()} className="border-slate-700 text-slate-400">
          <RefreshCw size={14} className="mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const topCategories = Object.entries(data.signals.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  const days = Object.entries(data.pipeline.signalsPerDay)
    .sort(([a], [b]) => a.localeCompare(b))
  const maxPerDay = Math.max(...days.map(([, v]) => v), 1)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time platform overview
            {data.pipeline.lastSignalAt && (
              <span className="ml-2 text-slate-600">
                · Last signal {timeAgo(data.pipeline.lastSignalAt)}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Signals"
          value={data.signals.total.toLocaleString()}
          icon={<Database size={18} />}
          detail={`+${data.signals.last24h} last 24h`}
          detailColor={data.signals.last24h > 0 ? 'text-green-400' : 'text-slate-600'}
        />
        <StatCard
          label="Pending Review"
          value={(data.triage.pending + data.triage.review).toLocaleString()}
          icon={<Clock size={18} />}
          detail={`${data.triage.review} flagged for review`}
          detailColor="text-yellow-400"
          href="/admin/intel?status=pending"
        />
        <StatCard
          label="Approved"
          value={data.triage.approved.toLocaleString()}
          icon={<CheckCircle size={18} />}
          detail={`${data.triage.rejected} rejected`}
          detailColor="text-green-400"
          href="/admin/intel?status=approved"
        />
        <StatCard
          label="Active Sources"
          value={data.sources.active.toLocaleString()}
          icon={<Radio size={18} />}
          detail={`${data.sources.total} total · ${data.sources.inactive} inactive`}
          detailColor="text-slate-500"
          href="/admin/sources"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signal volume */}
        <Card className="lg:col-span-2 bg-slate-800/40 border-slate-800 hover:bg-slate-800/60 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-100">Signal Volume</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Last 7 days · {data.signals.last7d} signals</p>
              </div>
              <TrendingUp size={16} className="text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {days.map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-slate-500">{count}</span>
                  <div
                    className="w-full bg-brand-500/30 rounded-t transition-all duration-300 hover:bg-brand-500/50"
                    style={{ height: `${(count / maxPerDay) * 100}%`, minHeight: '4px' }}
                  />
                  <span className="text-[10px] text-slate-600">
                    {new Date(day).toLocaleDateString('en-GB', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Severity distribution */}
        <Card className="bg-slate-800/40 border-slate-800 hover:bg-slate-800/60 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-100">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.signals.bySeverity)
              .sort(([, a], [, b]) => b - a)
              .map(([sev, count]) => {
                const pct = Math.round((count / data.signals.total) * 100)
                return (
                  <div key={sev} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 capitalize">{sev}</span>
                      <span className="text-xs text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${SEVERITY_COLORS[sev] || 'bg-slate-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top categories */}
        <Card className="bg-slate-800/40 border-slate-800 hover:bg-slate-800/60 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-100">Top Categories</CardTitle>
                <p className="text-xs text-slate-500 mt-1">{Object.keys(data.signals.byCategory).length} categories tracked</p>
              </div>
              <Link
                href="/admin/intel"
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCategories.map(([cat, count]) => (
              <div
                key={cat}
                className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-lg border border-slate-800/50 hover:border-slate-700/50 transition-colors"
              >
                <span className={`text-sm font-medium ${CATEGORY_COLORS[cat] || 'text-slate-300'}`}>
                  {cat.replace('_', ' ')}
                </span>
                <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-0 text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pipeline status */}
        <Card className="bg-slate-800/40 border-slate-800 hover:bg-slate-800/60 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-100">Pipeline Status</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Triage & source health</p>
              </div>
              <Activity size={16} className="text-slate-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Triage funnel */}
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Triage Funnel</p>
              <div className="grid grid-cols-4 gap-2">
                <FunnelCard label="Pending" value={data.triage.pending} color="text-slate-400" />
                <FunnelCard label="Review" value={data.triage.review} color="text-yellow-400" />
                <FunnelCard label="Approved" value={data.triage.approved} color="text-green-400" />
                <FunnelCard label="Rejected" value={data.triage.rejected} color="text-red-400" />
              </div>
            </div>

            {/* Source types */}
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source Types</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.sources.byType).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="border-slate-700 text-slate-400 text-xs">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* System health */}
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">System</p>
              <div className="space-y-1.5">
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
          </CardContent>
        </Card>
      </div>
    </div>
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
    <Card className="bg-slate-800/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 transition-all group cursor-default">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <div className="text-slate-600 group-hover:text-slate-500 transition-colors">
            {icon}
          </div>
        </div>
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
        {detail && (
          <p className={`text-xs mt-1.5 ${detailColor}`}>{detail}</p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href} className="block">{inner}</Link>
  }
  return inner
}

function FunnelCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-2.5 bg-slate-900/40 rounded-lg border border-slate-800/50">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
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
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-[10px] text-slate-600">{detail}</span>}
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor} ${status === 'online' ? 'animate-pulse' : ''}`} />
        <span className="text-[10px] text-slate-500 font-medium">{status}</span>
      </div>
    </div>
  )
}
