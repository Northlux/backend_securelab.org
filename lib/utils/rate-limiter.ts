/**
 * Rate Limiter for Import Operations
 * Tracks imports per user using a counter table in Supabase
 */

// Create a simple in-memory cache for rate limiting (for development)
// In production, use Redis or Supabase rate_limit_counters table
const importLimits = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if user has exceeded import rate limit
 * Limit: 5 imports per 1 minute per user
 */
export async function checkImportRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
  const now = Date.now()
  const ONE_MINUTE = 60 * 1000
  const IMPORT_LIMIT = 5

  let limit = importLimits.get(userId)

  // If no entry or reset time passed, create new entry
  if (!limit || now > limit.resetTime) {
    importLimits.set(userId, {
      count: 1,
      resetTime: now + ONE_MINUTE,
    })
    return {
      allowed: true,
      remaining: IMPORT_LIMIT - 1,
      resetSeconds: 60,
    }
  }

  // Check if user exceeded limit
  if (limit.count >= IMPORT_LIMIT) {
    const resetSeconds = Math.ceil((limit.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    }
  }

  // Increment counter
  limit.count++
  importLimits.set(userId, limit)

  const resetSeconds = Math.ceil((limit.resetTime - now) / 1000)
  return {
    allowed: true,
    remaining: IMPORT_LIMIT - limit.count,
    resetSeconds,
  }
}

/**
 * Alternative: Database-backed rate limiting (more reliable for production)
 * Uncomment to use Supabase for persistent rate limiting
 * Requires: import { createClient, SupabaseClient } from '@supabase/supabase-js'
 */
/*
export async function checkImportRateLimitDatabase(
  supabase: any,
  userId: string
): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
  const now = new Date()
  const ONE_MINUTE_AGO = new Date(now.getTime() - 60 * 1000)
  const IMPORT_LIMIT = 5

  try {
    // Count imports in last minute
    const { data, error } = await supabase
      .from('import_rate_limits')
      .select('count')
      .eq('user_id', userId)
      .gte('last_import', ONE_MINUTE_AGO.toISOString())
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error)
      return { allowed: true, remaining: IMPORT_LIMIT, resetSeconds: 60 }
    }

    const count = data?.count || 0

    if (count >= IMPORT_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: 60,
      }
    }

    // Update counter
    await supabase
      .from('import_rate_limits')
      .upsert({
        user_id: userId,
        count: count + 1,
        last_import: now.toISOString(),
      }, { onConflict: 'user_id' })

    return {
      allowed: true,
      remaining: IMPORT_LIMIT - (count + 1),
      resetSeconds: 60,
    }
  } catch (err) {
    console.error('Rate limit database error:', err)
    // Fail open - allow import if rate limit check fails
    return { allowed: true, remaining: IMPORT_LIMIT, resetSeconds: 60 }
  }
}
*/
