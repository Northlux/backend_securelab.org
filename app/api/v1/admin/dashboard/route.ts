/**
 * Dashboard Stats API
 *
 * Returns real-time platform metrics for the admin dashboard.
 * Queries signals, triage_results, sources, and ingestion_logs.
 *
 * GET /api/v1/admin/dashboard
 *
 * Response:
 * {
 *   signals: { total, last24h, last7d, byCategory, bySeverity },
 *   triage: { approved, rejected, review, pending, total },
 *   sources: { total, active, inactive, byType },
 *   ingestion: { recentLogs },
 *   pipeline: { lastRunAt, signalsPerDay }
 * }
 */
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const now = new Date()
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  // --- Signals ---
  const { count: totalSignals } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })

  const { count: last24h } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', h24)

  const { count: last7d } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', d7)

  // Category breakdown
  const { data: catData } = await supabase
    .from('signals')
    .select('signal_category')

  const byCategory: Record<string, number> = {}
  for (const row of catData || []) {
    const c = row.signal_category
    byCategory[c] = (byCategory[c] || 0) + 1
  }

  // Severity breakdown
  const { data: sevData } = await supabase
    .from('signals')
    .select('severity')

  const bySeverity: Record<string, number> = {}
  for (const row of sevData || []) {
    const s = row.severity
    bySeverity[s] = (bySeverity[s] || 0) + 1
  }

  // --- Triage ---
  const { data: triageData } = await supabase
    .from('triage_results')
    .select('triage_status')

  const triageCounts: Record<string, number> = {
    approved: 0,
    rejected: 0,
    review: 0,
  }
  for (const row of triageData || []) {
    const s = row.triage_status
    triageCounts[s] = (triageCounts[s] || 0) + 1
  }
  const totalTriaged = Object.values(triageCounts).reduce((a, b) => a + b, 0)
  triageCounts.pending = (totalSignals || 0) - totalTriaged

  // --- Sources ---
  const { data: sourcesData } = await supabase
    .from('sources')
    .select('id, is_active, source_type')

  const sourceCounts = {
    total: sourcesData?.length || 0,
    active: 0,
    inactive: 0,
    byType: {} as Record<string, number>,
  }
  for (const s of sourcesData || []) {
    if (s.is_active) sourceCounts.active++
    else sourceCounts.inactive++
    const t = s.source_type || 'unknown'
    sourceCounts.byType[t] = (sourceCounts.byType[t] || 0) + 1
  }

  // --- Ingestion logs (last 10) ---
  const { data: logsData } = await supabase
    .from('ingestion_logs')
    .select('id, source_id, status, signals_imported, signals_skipped, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  // --- Pipeline: signals per day (last 7 days) ---
  const { data: recentSignals } = await supabase
    .from('signals')
    .select('created_at')
    .gte('created_at', d7)

  const signalsPerDay: Record<string, number> = {}
  for (const s of recentSignals || []) {
    const day = s.created_at.slice(0, 10)
    signalsPerDay[day] = (signalsPerDay[day] || 0) + 1
  }

  // Last signal created_at as proxy for "last run"
  const { data: lastSignal } = await supabase
    .from('signals')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  return NextResponse.json({
    signals: {
      total: totalSignals || 0,
      last24h: last24h || 0,
      last7d: last7d || 0,
      byCategory,
      bySeverity,
    },
    triage: {
      ...triageCounts,
      total: totalTriaged,
    },
    sources: sourceCounts,
    ingestion: {
      recentLogs: logsData || [],
    },
    pipeline: {
      lastSignalAt: lastSignal?.[0]?.created_at || null,
      signalsPerDay,
    },
  })
}
