/**
 * Rate Limiter for Sensitive Operations
 *
 * SECURITY: Prevents DOS attacks and user enumeration
 * OWASP A10: Exceptional Conditions - Rate limiting for protection
 *
 * Tracks operations per user/identifier using in-memory counter
 * In production, use Redis or Supabase for distributed rate limiting
 */

// Create a simple in-memory cache for rate limiting (for development)
// In production, use Redis or Supabase rate_limit_counters table
const operationLimits = new Map<string, { count: number; resetTime: number }>()

/**
 * Generic rate limit checker for any operation
 *
 * @param key - Unique identifier (userId, IP, etc.) combined with operation name
 * @param maxRequests - Maximum requests allowed in time window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, resetSeconds: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): {
  allowed: boolean
  remaining: number
  resetSeconds: number
} {
  const now = Date.now()
  let limit = operationLimits.get(key)

  // If no entry or reset time passed, create new entry
  if (!limit || now > limit.resetTime) {
    operationLimits.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    }
  }

  // Check if exceeded limit
  if (limit.count >= maxRequests) {
    const resetSeconds = Math.ceil((limit.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    }
  }

  // Increment counter
  limit.count++
  operationLimits.set(key, limit)

  const resetSeconds = Math.ceil((limit.resetTime - now) / 1000)
  return {
    allowed: true,
    remaining: maxRequests - limit.count,
    resetSeconds,
  }
}

/**
 * Check if user has exceeded import rate limit
 * Limit: 5 imports per 1 minute per user
 *
 * DEPRECATED: Use checkRateLimit() instead
 * Kept for backward compatibility
 */
export async function checkImportRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
  const key = `import:${userId}`
  return checkRateLimit(key, 5, 60 * 1000)
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
