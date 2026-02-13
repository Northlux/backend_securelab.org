'use server'

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { createRateLimitKey, getRateLimit, type RateLimitKey } from '@/lib/utils/rate-limits'

/**
 * Get signal statistics
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getSignalStats() {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_STATS' as RateLimitKey),
      getRateLimit('SIGNAL_STATS' as RateLimitKey).max,
      getRateLimit('SIGNAL_STATS' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
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
    console.error('[getSignalStats] Error:', err)
    throw err
  }
}

/**
 * Get source statistics
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getSourceStats() {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SOURCE_STATS' as RateLimitKey),
      getRateLimit('SOURCE_STATS' as RateLimitKey).max,
      getRateLimit('SOURCE_STATS' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
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
    console.error('[getSourceStats] Error:', err)
    throw err
  }
}

/**
 * Get signals grouped by category
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getSignalsByCategory() {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_CATEGORY' as RateLimitKey),
      getRateLimit('SIGNAL_CATEGORY' as RateLimitKey).max,
      getRateLimit('SIGNAL_CATEGORY' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
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
    console.error('[getSignalsByCategory] Error:', err)
    throw err
  }
}

// Validation schema for getRecentImports
const RecentImportsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
})

/**
 * Get recent ingestion logs
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: limit parameter
 */
export async function getRecentImports(limit: number = 10) {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Input validation
    const validated = RecentImportsSchema.parse({ limit })

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'INGESTION_LIST' as RateLimitKey),
      getRateLimit('INGESTION_LIST' as RateLimitKey).max,
      getRateLimit('INGESTION_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('ingestion_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(validated.limit)

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
    console.error('[getRecentImports] Error:', err)
    throw err
  }
}

/**
 * Get signals grouped by severity
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getSignalsBySeverity() {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_SEVERITY' as RateLimitKey),
      getRateLimit('SIGNAL_SEVERITY' as RateLimitKey).max,
      getRateLimit('SIGNAL_SEVERITY' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
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
    console.error('[getSignalsBySeverity] Error:', err)
    throw err
  }
}
