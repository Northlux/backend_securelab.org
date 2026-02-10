import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardCards from '@/app/components/admin/dashboard-cards'
import ImportStats from '@/app/components/admin/import-stats'
import SignalChart from '@/app/components/admin/signal-chart'
import { SignalTrendChart } from '@/app/components/admin/signal-trend-chart'
import { SourceRanking } from '@/app/components/admin/source-ranking'
import { SeverityDistribution } from '@/app/components/admin/severity-distribution'

interface SignalStats {
  totalSignals: number
  thisWeek: number
  critical: number
}

interface SourceStats {
  totalSources: number
  activeSources: number
}

interface ImportLog {
  id: string
  created_at: string
  import_source: string
  signals_imported: number
  signals_skipped: number
  signals_errors: number
}

interface SignalCategory {
  signal_category: string
  count: number
}

interface SignalRow {
  created_at: string
  severity: string
}

interface SourceRow {
  is_active: boolean
}

interface ImportLogRow {
  id: string
  created_at: string
  import_source: string | null
  signals_imported: number | null
  signals_skipped: number | null
  signals_errors: number | null
}

interface SignalCategoryRow {
  signal_category: string | null
}

async function fetchSignalStats(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<SignalStats> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('created_at, severity')

    if (error) {
      console.error('Failed to fetch signal stats:', error)
      return { totalSignals: 0, thisWeek: 0, critical: 0 }
    }

    const signals = (data as SignalRow[]) || []
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return {
      totalSignals: signals.length,
      thisWeek: signals.filter(
        (s: SignalRow) => new Date(s.created_at) > oneWeekAgo
      ).length,
      critical: signals.filter((s: SignalRow) => s.severity === 'critical').length,
    }
  } catch (err) {
    console.error('Error fetching signal stats:', err)
    return { totalSignals: 0, thisWeek: 0, critical: 0 }
  }
}

async function fetchSourceStats(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<SourceStats> {
  try {
    const { data, error } = await supabase
      .from('sources')
      .select('is_active')

    if (error) {
      console.error('Failed to fetch source stats:', error)
      return { totalSources: 0, activeSources: 0 }
    }

    const sources = (data as SourceRow[]) || []
    return {
      totalSources: sources.length,
      activeSources: sources.filter((s: SourceRow) => s.is_active).length,
    }
  } catch (err) {
    console.error('Error fetching source stats:', err)
    return { totalSources: 0, activeSources: 0 }
  }
}

async function fetchRecentImports(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<ImportLog[]> {
  try {
    const { data, error } = await supabase
      .from('ingestion_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Failed to fetch recent imports:', error)
      return []
    }

    return ((data as ImportLogRow[]) || []).map((log: ImportLogRow) => ({
      id: log.id,
      created_at: log.created_at,
      import_source: log.import_source || 'unknown',
      signals_imported: log.signals_imported || 0,
      signals_skipped: log.signals_skipped || 0,
      signals_errors: log.signals_errors || 0,
    }))
  } catch (err) {
    console.error('Error fetching recent imports:', err)
    return []
  }
}

async function fetchSignalsByCategory(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<SignalCategory[]> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('signal_category')

    if (error) {
      console.error('Failed to fetch signal categories:', error)
      return []
    }

    const signals = (data as SignalCategoryRow[]) || []
    const categoryMap = new Map<string, number>()

    for (const signal of signals) {
      const category = signal.signal_category || 'unknown'
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    }

    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      signal_category: name,
      count,
    }))
  } catch (err) {
    console.error('Error fetching signal categories:', err)
    return []
  }
}

async function fetchSignalTrend(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<Array<{ date: string; count: number }>> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('created_at')

    if (error) {
      console.error('Failed to fetch signal trend:', error)
      return []
    }

    const signals = (data as Array<{ created_at: string }>) || []
    const dayMap = new Map<string, number>()

    // Last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0] || ''
      dayMap.set(dateStr, 0)
    }

    for (const signal of signals) {
      const dateStr = new Date(signal.created_at).toISOString().split('T')[0] || ''
      if (dayMap.has(dateStr)) {
        dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1)
      }
    }

    return Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse()
  } catch (err) {
    console.error('Error fetching signal trend:', err)
    return []
  }
}

async function fetchSourceRanking(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<Array<{ sourceName: string; count: number }>> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('source_id, sources(name)')

    if (error) {
      console.error('Failed to fetch source ranking:', error)
      return []
    }

    const signals = (data as Array<any>) || []
    const sourceMap = new Map<string, number>()

    for (const signal of signals) {
      const sourceName = signal.sources?.name || 'Unknown'
      sourceMap.set(sourceName, (sourceMap.get(sourceName) || 0) + 1)
    }

    return Array.from(sourceMap.entries())
      .map(([sourceName, count]) => ({ sourceName, count }))
      .sort((a, b) => b.count - a.count)
  } catch (err) {
    console.error('Error fetching source ranking:', err)
    return []
  }
}

async function fetchSeverityDistribution(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<Array<{ severity: string; count: number }>> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('severity')

    if (error) {
      console.error('Failed to fetch severity distribution:', error)
      return []
    }

    const signals = (data as Array<{ severity: string }>) || []
    const severityMap = new Map<string, number>()

    for (const signal of signals) {
      const severity = signal.severity || 'unknown'
      severityMap.set(severity, (severityMap.get(severity) || 0) + 1)
    }

    return Array.from(severityMap.entries()).map(([severity, count]) => ({
      severity,
      count,
    }))
  } catch (err) {
    console.error('Error fetching severity distribution:', err)
    return []
  }
}

export default async function IntelDashboardPage() {
  const supabase = await createServerSupabaseClient()

  // ✅ Check authentication (via auth cookie)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      redirect('/login')
    }
  } catch (err) {
    console.error('Auth check failed:', err)
    redirect('/login')
  }

  // ✅ Fetch all data in parallel
  const [signalStats, sourceStats, recentImports, signalsByCategory, signalTrend, sourceRanking, severityDistribution] = await Promise.all([
    fetchSignalStats(supabase),
    fetchSourceStats(supabase),
    fetchRecentImports(supabase),
    fetchSignalsByCategory(supabase),
    fetchSignalTrend(supabase),
    fetchSourceRanking(supabase),
    fetchSeverityDistribution(supabase),
  ])

  return (
    <main className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Threat Intelligence Dashboard</h1>
        <p className="text-slate-400 mt-2">Monitor signals, sources, and ingestion activity</p>
      </div>

      {/* Stats Cards */}
      <DashboardCards stats={signalStats} sources={sourceStats} />

      {/* Charts and Analytics Rows */}

      {/* Trend and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signal Trend */}
        <SignalTrendChart data={signalTrend} />

        {/* Severity Distribution */}
        <SeverityDistribution data={severityDistribution} />
      </div>

      {/* Sources and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Ranking */}
        <SourceRanking data={sourceRanking} />

        {/* Signal Distribution Chart */}
        <SignalChart data={signalsByCategory} />
      </div>

      {/* Recent Imports */}
      <ImportStats imports={recentImports} />

      {/* Quick Actions */}
      <div className="border border-slate-800 rounded-lg p-6 bg-slate-800/50">
        <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href="/admin/intel/import"
            className="inline-flex items-center justify-center px-4 py-3 rounded bg-brand-blue hover:bg-brand-blue/80 text-white font-medium transition"
          >
            📤 Import Signals
          </a>
          <a
            href="/admin/intel/sources"
            className="inline-flex items-center justify-center px-4 py-3 rounded bg-brand-blue hover:bg-brand-blue/80 text-white font-medium transition"
          >
            🔌 Manage Sources
          </a>
          <a
            href="/admin/intel/signals"
            className="inline-flex items-center justify-center px-4 py-3 rounded bg-brand-blue hover:bg-brand-blue/80 text-white font-medium transition"
          >
            🔍 Browse Signals
          </a>
        </div>
      </div>
    </main>
  )
}
