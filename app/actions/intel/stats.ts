'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getSignalStats() {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('signals')
      .select('created_at, severity')

    if (error) throw error

    const signals = data || []
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return {
      totalSignals: signals.length,
      thisWeek: signals.filter(
        (s: { created_at: string }) => new Date(s.created_at) > oneWeekAgo
      ).length,
      critical: signals.filter(
        (s: { severity: string }) => s.severity === 'critical'
      ).length,
    }
  } catch (err) {
    console.error('Error fetching signal stats:', err)
    return { totalSignals: 0, thisWeek: 0, critical: 0 }
  }
}

export async function getSourceStats() {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from('sources').select('is_active')

    if (error) throw error

    const sources = data || []
    return {
      totalSources: sources.length,
      activeSources: sources.filter(
        (s: { is_active: boolean }) => s.is_active
      ).length,
    }
  } catch (err) {
    console.error('Error fetching source stats:', err)
    return { totalSources: 0, activeSources: 0 }
  }
}

export async function getSignalsByCategory() {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from('signals').select('signal_category')

    if (error) throw error

    const signals = data || []
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

export async function getRecentImports(limit: number = 10) {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('ingestion_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((log: any) => ({
      id: log.id,
      created_at: log.started_at,
      import_source: log.source_id || 'unknown',
      signals_imported: log.signals_imported || 0,
      signals_skipped: log.signals_skipped || 0,
      signals_errors: log.signals_errored || 0,
    }))
  } catch (err) {
    console.error('Error fetching recent imports:', err)
    return []
  }
}

export async function getSignalsBySeverity() {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase.from('signals').select('severity')

    if (error) throw error

    const signals = data || []
    const severityMap = new Map<string, number>()

    for (const signal of signals) {
      const severity = signal.severity || 'unknown'
      severityMap.set(severity, (severityMap.get(severity) || 0) + 1)
    }

    return Array.from(severityMap.entries()).map(([name, count]) => ({
      severity: name,
      count,
    }))
  } catch (err) {
    console.error('Error fetching signal severity:', err)
    return []
  }
}
