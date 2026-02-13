'use server'

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAnalystOrAdmin } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logUserAction } from '@/lib/utils/audit-logger'
import { createRateLimitKey, getRateLimit, type RateLimitKey } from '@/lib/utils/rate-limits'

// Validation schemas
const UuidArraySchema = z.array(z.string().uuid()).min(1).max(1000)
const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info'])

/**
 * Bulk delete signals
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 10/hour (very restrictive)
 * ✅ Input validation: UUID array
 */
export async function bulkDeleteSignals(ids: string[]) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validated = UuidArraySchema.parse(ids)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'BULK_DELETE' as RateLimitKey),
      getRateLimit('BULK_DELETE' as RateLimitKey).max,
      getRateLimit('BULK_DELETE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('signals')
      .delete()
      .in('id', validated)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'bulk_delete_signals', 'signal', undefined, {
      count: validated.length,
    })

    revalidatePath('/admin/intel/signals')
    return { deleted: validated.length }
  } catch (error) {
    console.error('[bulkDeleteSignals] Error:', error)
    throw error
  }
}

/**
 * Bulk update signal severity
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 10/hour (very restrictive)
 * ✅ Input validation: UUID array + severity enum
 */
export async function bulkUpdateSeverity(
  ids: string[],
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validatedIds = UuidArraySchema.parse(ids)
    const validatedSeverity = SeveritySchema.parse(severity)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'BULK_UPDATE' as RateLimitKey),
      getRateLimit('BULK_UPDATE' as RateLimitKey).max,
      getRateLimit('BULK_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('signals')
      .update({ severity: validatedSeverity })
      .in('id', validatedIds)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'bulk_update_severity', 'signal', undefined, {
      count: validatedIds.length,
      severity: validatedSeverity,
    })

    revalidatePath('/admin/intel/signals')
    return { updated: validatedIds.length }
  } catch (error) {
    console.error('[bulkUpdateSeverity] Error:', error)
    throw error
  }
}

/**
 * Bulk add tags to signals
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 10/hour (very restrictive)
 * ✅ Input validation: UUID arrays
 */
export async function bulkAddTags(signalIds: string[], tagIds: string[]) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validatedSignalIds = UuidArraySchema.parse(signalIds)
    const validatedTagIds = UuidArraySchema.parse(tagIds)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'BULK_UPDATE' as RateLimitKey),
      getRateLimit('BULK_UPDATE' as RateLimitKey).max,
      getRateLimit('BULK_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const insertData = validatedSignalIds.flatMap(signalId =>
      validatedTagIds.map(tagId => ({ signal_id: signalId, tag_id: tagId }))
    )

    // Ignore duplicates by just trying to insert
    const { error } = await supabase
      .from('signal_tags')
      .insert(insertData)
      .select()

    // Ignore "duplicate key" errors
    if (error && !error.message.includes('duplicate')) {
      throw error
    }

    // Audit log
    await logUserAction(user.userId, 'bulk_add_tags', 'signal', undefined, {
      signal_count: validatedSignalIds.length,
      tag_count: validatedTagIds.length,
      total: insertData.length,
    })

    revalidatePath('/admin/intel/signals')
    return { added: insertData.length }
  } catch (error) {
    console.error('[bulkAddTags] Error:', error)
    throw error
  }
}

/**
 * Bulk remove tags from signals
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 10/hour (very restrictive)
 * ✅ Input validation: UUID arrays
 */
export async function bulkRemoveTags(signalIds: string[], tagIds: string[]) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validatedSignalIds = UuidArraySchema.parse(signalIds)
    const validatedTagIds = UuidArraySchema.parse(tagIds)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'BULK_UPDATE' as RateLimitKey),
      getRateLimit('BULK_UPDATE' as RateLimitKey).max,
      getRateLimit('BULK_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    let query = supabase.from('signal_tags').delete()
    query = query.in('signal_id', validatedSignalIds)
    query = query.in('tag_id', validatedTagIds)

    const { error } = await query

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'bulk_remove_tags', 'signal', undefined, {
      signal_count: validatedSignalIds.length,
      tag_count: validatedTagIds.length,
    })

    revalidatePath('/admin/intel/signals')
    return { removed: validatedSignalIds.length * validatedTagIds.length }
  } catch (error) {
    console.error('[bulkRemoveTags] Error:', error)
    throw error
  }
}

/**
 * Bulk mark signals as verified
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 10/hour (very restrictive)
 * ✅ Input validation: UUID array
 */
export async function bulkMarkAsVerified(ids: string[]) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validated = UuidArraySchema.parse(ids)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'BULK_VERIFY' as RateLimitKey),
      getRateLimit('BULK_VERIFY' as RateLimitKey).max,
      getRateLimit('BULK_VERIFY' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('signals')
      .update({ is_verified: true })
      .in('id', validated)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'bulk_mark_verified', 'signal', undefined, {
      count: validated.length,
      verified: true,
    })

    revalidatePath('/admin/intel/signals')
    return { updated: validated.length }
  } catch (error) {
    console.error('[bulkMarkAsVerified] Error:', error)
    throw error
  }
}

/**
 * Bulk unmark signals as verified
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 10/hour (very restrictive)
 * ✅ Input validation: UUID array
 */
export async function bulkUnmarkAsVerified(ids: string[]) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validated = UuidArraySchema.parse(ids)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'BULK_VERIFY' as RateLimitKey),
      getRateLimit('BULK_VERIFY' as RateLimitKey).max,
      getRateLimit('BULK_VERIFY' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('signals')
      .update({ is_verified: false })
      .in('id', validated)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'bulk_unmark_verified', 'signal', undefined, {
      count: validated.length,
      verified: false,
    })

    revalidatePath('/admin/intel/signals')
    return { updated: validated.length }
  } catch (error) {
    console.error('[bulkUnmarkAsVerified] Error:', error)
    throw error
  }
}
